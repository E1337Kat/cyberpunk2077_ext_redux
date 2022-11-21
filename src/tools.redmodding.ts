import {
  getOrElse as getOrElseO,
} from "fp-ts/lib/Option";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  isEmpty,
} from "fp-ts/lib/ReadonlyArray";
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
} from "./index.metadata";
import {
  makeV2077LoadOrderFrom,
  loadOrderToREDdeployRunParameters,
} from "./load_order";
import {
  loadOrderFromVortexState,
} from "./load_order.functions";
import {
  LoadOrder,
} from "./load_order.types";
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
  InfoNotification,
  showInfoNotification,
} from "./ui.notifications";
import {
  constant,
  S,
} from "./util.functions";
import {
  VortexApi,
  VortexExtensionContext,
  VortexLoadOrder,
  VortexRunParameters,
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

    transformRunParams:
      ({ executable, args, options }: VortexRunParameters): Promise<VortexRunParameters> => {
        const me = `${EXTENSION_NAME_INTERNAL} REDdeploy hook`;

        const vortexApi: VortexApi = {
          ...vortexExt.api,
          log: vortexApiLib.log,
        };

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

          vortexApi.log(`debug`, `${me} not our tool, this is ok, skipping: ${S({ executable, args, options })}`);
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

        // TODO: Generate load order if none found?
        //       https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/285
        const latestLoadOrderInVortexFormat: VortexLoadOrder = pipe(
          loadOrderFromVortexState(vortexApi.store.getState(), activeProfile),
          getOrElseO(constant([])),
        );

        const timestampAsLoadOrderId = Date.now();

        const latestLoadOrder: LoadOrder =
          makeV2077LoadOrderFrom(latestLoadOrderInVortexFormat, activeProfile.id, timestampAsLoadOrderId);

        // exclusive is something we want but that's handled higher up so no need here
        const overridingActualParamsToREDdeployLatestLoadOrder =
          loadOrderToREDdeployRunParameters(gameDir, latestLoadOrder);

        vortexApi.log(`debug`, `${me}: Actual run parameters we're using ${S(overridingActualParamsToREDdeployLatestLoadOrder)}`);

        if (isEmpty(latestLoadOrderInVortexFormat)) {
          vortexApi.log(`warn`, `${me}: no mods in load order, running default REDdeploy!`);
          showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentDefaulted);
        } else {
          vortexApi.log(`info`, `${me}: load order ready for manual REDdeployment, starting!`);
          showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentStarted);
        }

        return Promise.resolve(overridingActualParamsToREDdeployLatestLoadOrder);
      },
  });


export const REDmoddingTools = [
  GameExeModded,
  REDlauncher,
  REDdeployManual,
];


export const REDmoddingStartHooks = [
  makeREDdeployManualHookToGetLoadOrder,
];


export const available: ToolSpec = {
  tools: REDmoddingTools,
  startHooks: REDmoddingStartHooks,
};
