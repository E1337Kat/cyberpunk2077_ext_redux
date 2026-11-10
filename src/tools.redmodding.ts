import {
  pipe,
} from "fp-ts/lib/function";
import path from "path/win32";
import {
  map as mapE,
  isLeft,
} from "fp-ts/lib/Either";
import {
  FeatureSet,
} from "./features";
import {
  EXTENSION_NAME_INTERNAL,
  GAME_EXE_RELATIVE_PATH,
  GAME_ID,
  GOGAPP_ID,
} from "./index.metadata";
import {
  deployREDmodForCurrentLoadOrder,
} from "./load_order";
import {
  redmodToolingIsInstalled,
} from "./redmod.deploy";
import {
  InfoNotification,
  showInfoNotification,
} from "./ui.notifications";
import {
  REDlauncherExeRelativePath,
  REDdeployExeRelativePath,
} from "./redmodding.metadata";
import {
  MakeToolStartHookWithStateFunc,
  ToolSpec,
  ToolStartHook,
} from "./tools.types";
import {
  constant,
  getErrorMessageOrDefault,
  S,
} from "./util.functions";
import {
  makeVortexApi,
  VortexExtensionContext,
  VortexLogFunc,
  VortexProfile,
  VortexRunParameters,
  VortexState,
  VortexToolShim,
} from "./vortex-wrapper";
import {
  gameDirPath,
} from "./state.functions";


export const GameExeModdedToolId = `${EXTENSION_NAME_INTERNAL}-game-exe-modded`;

export const REDlauncherToolId = `${EXTENSION_NAME_INTERNAL}-tools-REDLauncher`;

export const REDdeployManualToolId = `${EXTENSION_NAME_INTERNAL}-tools-redMod`;
export const REDdeployManualToolNeedsLOGenerated = `${REDdeployManualToolId}-will-generate-params-later`;

export const REDdeployManualToolHookId = `${REDdeployManualToolId}-hook`;

export const DummyCmdExeCallForToolToCallAfterRealWorkDone: VortexRunParameters = {
  executable: `cmd.exe`,
  args: [`/c`, `echo`, ``],
  options: {
    shell: true,
    detach: true,
    expectSuccess: true,
  },
};

export const GameExeModded: VortexToolShim = {
  id: GameExeModdedToolId,
  name: `Launch Game with REDmods Enabled`,
  shortName: `cp2077.exe -modded`,
  logo: `gameicon.jpg`,
  relative: true,
  requiredFiles: [GAME_EXE_RELATIVE_PATH],
  executable: constant(GAME_EXE_RELATIVE_PATH),
  parameters: [`-modded`],
};

export const REDlauncher: VortexToolShim = {
  id: REDlauncherExeRelativePath,
  name: `REDLauncher (GOG/Steam/Epic)`,
  shortName: `REDLauncher`,
  logo: `REDLauncher.png`,
  relative: true,
  requiredFiles: [REDlauncherExeRelativePath],
  executable: constant(REDlauncherExeRelativePath),
  parameters: [`-modded`],
};

export const REDdeployManual: VortexToolShim = {
  id: REDdeployManualToolId,
  name: `REDmod Deploy Latest Load Order`,
  shortName: `REDdeploy`,
  logo: `REDdeploy.png`,
  relative: true,
  requiredFiles: [REDdeployExeRelativePath],
  executable: constant(REDdeployExeRelativePath),
  parameters: [REDdeployManualToolNeedsLOGenerated],
  shell: true,
  exclusive: true,
  // Can't be set here for some reason, we do this in the hook instead
  // expectSuccess: true
};


export const makeREDdeployManualHookToGetLoadOrder: MakeToolStartHookWithStateFunc =
  // wrap...
  (vortexExt: VortexExtensionContext, vortexApiLib: any, _featureSet: FeatureSet): ToolStartHook => ({
    // ...the actual hook

    hookId:
      REDdeployManualToolHookId,

    doActualWorkInTheHookAndReturnDummyParams:
      async ({ executable, args, options }: VortexRunParameters): Promise<VortexRunParameters> => {
        const me = `${EXTENSION_NAME_INTERNAL} REDdeploy hook`;

        const vortexApi = makeVortexApi(vortexExt, vortexApiLib);

        const toolPaths = pipe(
          gameDirPath(vortexApi),
          mapE((gameDir) => [gameDir, path.join(gameDir, REDdeployExeRelativePath)]),
        );

        if (isLeft(toolPaths)) {
          vortexApi.log(`warn`, `${me}: Unable to resolve game dir, maybe external tool w/o CP2077 installed? Skipping hook.`);
          return Promise.resolve({ executable, args, options });
        }

        const [gameDir, fullExePath] = toolPaths.right;

        if (executable !== fullExePath
           || args.length !== 1
           || args[0] !== REDdeployManualToolNeedsLOGenerated) {

          vortexApi.log(`debug`, `${me}: Call doesn't match this hook, skipping: ${S({ executable, args, options })}`);
          return Promise.resolve({ executable, args, options });
        }

        vortexApi.log(`info`, `${me}: manual REDdeploy invoked`);
        vortexApi.log(`debug`, `${me}: Incoming run parameters (may be overridden): ${S({ executable, args, options })}`);

        const activeProfile =
          vortexApiLib.selectors.activeProfile(vortexExt.api.store.getState());

        if (activeProfile === undefined) {
          const errorMessage = `${me}: no active profile, cannot deploy load order`;

          vortexApi.log(`error`, errorMessage);
          return Promise.reject(new vortexApiLib.util.ProcessCanceled(errorMessage));
        }

        try {
          await deployREDmodForCurrentLoadOrder(vortexApi, gameDir);

          vortexApi.log(`info`, `${me}: REDdeploy through tool completed`);
          return DummyCmdExeCallForToolToCallAfterRealWorkDone;

        } catch (error) {
          vortexApi.log(`error`, `${me}: REDmod deploy through tool failed: ${getErrorMessageOrDefault(error)}`);
          return DummyCmdExeCallForToolToCallAfterRealWorkDone;
        }
      },
  });


export const REDmoddingTools = [
  GameExeModded,
  REDlauncher,
  REDdeployManual,
];


// Every route that starts our game: the exe and the prelauncher are run from the
// game dir, and the GOG client is run with our game id.
const launchesTheGame = (
  gameDir: string,
  { executable, args }: VortexRunParameters,
): boolean => {
  const launched = path.relative(gameDir, executable).toLowerCase();

  const startsAGameBinary = [GAME_EXE_RELATIVE_PATH, REDlauncherExeRelativePath]
    .some((gameBinary) => path.normalize(gameBinary).toLowerCase() === launched);

  return startsAGameBinary || args.includes(`/gameId=${GOGAPP_ID}`);
};

interface VortexApiLibForLaunchHook {
  readonly log: VortexLogFunc;
  readonly util: { UserCanceled: new (message: string) => Error };
  readonly selectors: {
    activeProfile: (state: VortexState) => VortexProfile | undefined;
    discoveryByGame: (state: VortexState, gameId: string) => { path?: string } | undefined;
  };
}

export const makeREDmodDeployOnLaunchHook: MakeToolStartHookWithStateFunc =
  (
    vortexExt: VortexExtensionContext,
    vortexApiLib: VortexApiLibForLaunchHook,
    _featureSet: FeatureSet,
  ): ToolStartHook => ({

    hookId:
      `${EXTENSION_NAME_INTERNAL}-redmod-deploy-on-launch`,

    doActualWorkInTheHookAndReturnDummyParams:
      async (runParameters: VortexRunParameters): Promise<VortexRunParameters> => {
        const me = `${EXTENSION_NAME_INTERNAL} REDmod launch hook`;

        const vortexApi = makeVortexApi(vortexExt, vortexApiLib);

        // Start hooks fire for every game, and deploying reads the active profile.
        const activeProfile = vortexApiLib.selectors.activeProfile(vortexApi.store.getState());

        if (activeProfile?.gameId !== GAME_ID) {
          return runParameters;
        }

        const gameDir =
          vortexApiLib.selectors.discoveryByGame(vortexApi.store.getState(), GAME_ID)?.path;

        if (gameDir === undefined || !launchesTheGame(gameDir, runParameters)) {
          return runParameters;
        }

        if (!await redmodToolingIsInstalled(gameDir)) {
          vortexApi.log(`info`, `${me}: REDmod tooling isn't installed, launching without deploying`);
          return runParameters;
        }

        vortexApi.log(`info`, `${me}: Deploying REDmods before launch`);

        try {
          await deployREDmodForCurrentLoadOrder(vortexApi, gameDir);
        } catch (error) {
          const reason = getErrorMessageOrDefault(error);

          vortexApi.log(`error`, `${me}: REDmod deployment failed, canceling launch: ${reason}`);

          // Vortex cancels silently, so this notification is the only thing
          // telling the user why the game didn't start.
          showInfoNotification(
            vortexApi,
            InfoNotification.REDmodDeploymentFailed,
            `The game wasn't started: ${reason}`,
          );

          // UserCanceled, because a launcher route reports anything else as an
          // error and then starts the game anyway.
          throw new vortexApiLib.util.UserCanceled(`REDmod deployment failed, so the game wasn't started.`);
        }

        return runParameters;
      },
  });


export const REDmoddingStartHooks = [
  makeREDdeployManualHookToGetLoadOrder,
  makeREDmodDeployOnLaunchHook,
];


export const available: ToolSpec = {
  tools: REDmoddingTools,
  startHooks: REDmoddingStartHooks,
};
