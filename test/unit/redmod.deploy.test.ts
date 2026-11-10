import {
  EventEmitter,
} from "events";
import {
  spawn,
} from "child_process";
import path from "path/win32";
import {
  fs,
  mockedActiveProfile,
} from "@vortex-api-test-shimmed";
import {
  deployREDmodForCurrentLoadOrder,
} from "../../src/load_order";
import {
  redmodDeployArgs,
  redmodDeployedFilesNeedRebuilding,
} from "../../src/redmod.deploy";
import {
  GAME_EXE_RELATIVE_PATH,
  GOGAPP_ID,
} from "../../src/index.metadata";
import {
  REDlauncherExeRelativePath,
  REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES,
  REDMODDING_RTTI_METADATA_FILE_PATH,
  V2077_MODLIST_PATH,
} from "../../src/redmodding.metadata";
import {
  makeREDmodDeployOnLaunchHook,
} from "../../src/tools.redmodding";
import {
  ActivityNotification,
  InfoNotification,
} from "../../src/ui.notifications";
import {
  FeatureSet,
} from "../../src/features";
import {
  VortexApi,
  VortexExtensionContext,
  VortexLoadOrder,
  VortexProfile,
  VortexRunParameters,
} from "../../src/vortex-wrapper";

jest.mock(`child_process`, () => ({
  spawn: jest.fn(),
}));

const spawnMock = spawn as unknown as jest.Mock;

const GAMEDIR = `/fake/gamedir`;
const ANOTHER_TOOL = `/fake/tools/WolvenKit.exe`;
const GOG_CLIENT = `/fake/GOG Galaxy/GalaxyClient.exe`;

class FakeREDmod extends EventEmitter {
  public readonly stdout = new EventEmitter();

  public readonly stderr = new EventEmitter();
}

// Each spawn gets a fake redMod that does `behaviour` once the caller is listening.
const redmodRuns = (behaviour: (run: FakeREDmod) => void): void => {
  spawnMock.mockImplementation(() => {
    const run = new FakeREDmod();
    setImmediate(() => { behaviour(run); });
    return run;
  });
};

const redmodExitsWith = (exitCode: number, output = ``): void => {
  redmodRuns((run) => {
    if (output.length > 0) {
      run.stdout.emit(`data`, Buffer.from(output));
    }

    run.emit(`close`, exitCode);
  });
};

const vortexLoadOrderOf = (...modNames: string[]): VortexLoadOrder =>
  modNames.map((modName) => ({
    id: modName,
    modId: `1`,
    enabled: true,
    name: modName,
    data: {
      ownerVortexProfileId: mockedActiveProfile.id,
      vortexId: modName,
      vortexModId: `1`,
      vortexModVersion: `1.0.0`,
      vortexEnabled: true,
      redmodInfo: {
        name: modName,
        version: `1.0.0`,
        relativePath: `mods/${modName}`,
        vortexModId: `1`,
      },
    },
  })) as unknown as VortexLoadOrder;

const modListWritten = (): string =>
  fs.writeFileAsync.mock.calls.map(([, contents]) => contents).join(``);

const stateWithLoadOrder = (loadOrder: VortexLoadOrder): unknown => ({
  settings: { gameMode: { discovered: { cyberpunk2077: { path: GAMEDIR } } } },
  persistent: { loadOrder: { [mockedActiveProfile.id]: loadOrder } },
});

const makeApi = (loadOrder: VortexLoadOrder): VortexApi => ({
  log: jest.fn(),
  sendNotification: jest.fn(),
  dismissNotification: jest.fn(),
  store: { getState: jest.fn().mockReturnValue(stateWithLoadOrder(loadOrder)) },
} as unknown as VortexApi);

const notificationIdsSentTo = (api: VortexApi): string[] =>
  (api.sendNotification as unknown as jest.Mock).mock.calls.map(([{ id }]) => id);

const notificationMessagesSentTo = (api: VortexApi): string[] =>
  (api.sendNotification as unknown as jest.Mock).mock.calls.map(([{ message }]) => message);

const logLinesAt = (api: VortexApi, level: string): string[] =>
  (api.log as unknown as jest.Mock).mock.calls
    .filter(([loggedLevel]) => loggedLevel === level)
    .map(([, message]) => message);

const REDMOD_FAILURE_REASON = `Non-existant mod selected: "Mod X"!`;

const REDMOD_FAILED_OUTPUT = [
  `[DEPLOY] Stage 1/5 - Initialization`,
  REDMOD_FAILURE_REASON,
  ``,
  `Commandlet deploy has failed.`,
].join(`\r\n`);

const STATUS_CONTROL_C_EXIT = 0xC000013A;

beforeEach(() => {
  jest.clearAllMocks();

  redmodExitsWith(0);

  fs.statAsync.mockResolvedValue(undefined);
  fs.writeFileAsync.mockResolvedValue(undefined);
  fs.renameAsync.mockResolvedValue(undefined);
  fs.removeAsync.mockResolvedValue(undefined);
  fs.ensureDirWritableAsync.mockResolvedValue(undefined);
  fs.readFileAsync.mockResolvedValue(``);

});

describe(`REDmod deploy parameters`, () => {

  test(`points redMod at the game dir, the RTTI schema and our modlist`, () => {
    expect(redmodDeployArgs(GAMEDIR)).toEqual([
      `deploy`,
      `-reportProgress`,
      `-root`,
      GAMEDIR,
      `-rttiSchemaPath=${path.join(GAMEDIR, REDMODDING_RTTI_METADATA_FILE_PATH)}`,
      `-modlist=${path.join(GAMEDIR, V2077_MODLIST_PATH)}`,
    ]);
  });

  test(`lets redMod decide what to rebuild`, () => {
    expect(redmodDeployArgs(GAMEDIR)).not.toContain(`-force`);
  });

});

describe(`Deciding whether deployed REDmod files are stale`, () => {

  test(`rebuilds when the same mods are in a different order`, () => {
    expect(redmodDeployedFilesNeedRebuilding([`A`, `B`], [`B`, `A`])).toBe(true);
  });

  test(`leaves the deployed files alone when the order is unchanged`, () => {
    expect(redmodDeployedFilesNeedRebuilding([`A`, `B`], [`A`, `B`])).toBe(false);
  });

  test(`leaves the deployed files alone when a mod is added`, () => {
    expect(redmodDeployedFilesNeedRebuilding([`A`], [`A`, `B`])).toBe(false);
  });

  test(`leaves the deployed files alone when a mod is removed`, () => {
    expect(redmodDeployedFilesNeedRebuilding([`A`, `B`], [`A`])).toBe(false);
  });

});

describe(`Deploying the current load order`, () => {

  test(`writes the load order that is current when the deploy starts`, async () => {
    const order = vortexLoadOrderOf(`Mod X`, `Mod Y`);

    await deployREDmodForCurrentLoadOrder(makeApi(order), GAMEDIR);

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(modListWritten()).toBe(`Mod X\r\nMod Y`);
  });

  test(`clears the deployed files when only the order changed`, async () => {
    const order = vortexLoadOrderOf(`Mod X`, `Mod Y`);
    fs.readFileAsync.mockResolvedValue(`Mod Y\r\nMod X`);

    await deployREDmodForCurrentLoadOrder(makeApi(order), GAMEDIR);

    expect(fs.removeAsync)
      .toHaveBeenCalledWith(path.join(GAMEDIR, REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES));
  });

  test(`clears the deployed files when the modlist can't be read`, async () => {
    const order = vortexLoadOrderOf(`Mod X`, `Mod Y`);
    fs.readFileAsync.mockRejectedValue(Object.assign(new Error(`locked`), { code: `EBUSY` }));

    await deployREDmodForCurrentLoadOrder(makeApi(order), GAMEDIR);

    expect(fs.removeAsync)
      .toHaveBeenCalledWith(path.join(GAMEDIR, REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES));
  });

  test(`keeps the deployed files on the first deploy, with no modlist yet`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);
    fs.readFileAsync.mockRejectedValue(Object.assign(new Error(`nope`), { code: `ENOENT` }));

    await deployREDmodForCurrentLoadOrder(makeApi(order), GAMEDIR);

    expect(fs.removeAsync).not.toHaveBeenCalled();
  });

  test(`tells the user when redMod can't be run at all`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    redmodRuns((run) => { run.emit(`error`, new Error(`spawn ENOENT`)); });

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR)).rejects.toThrow(`spawn ENOENT`);

    expect(notificationIdsSentTo(api)).toContain(InfoNotification.REDmodDeploymentFailed);
    expect(api.dismissNotification).toHaveBeenCalledWith(ActivityNotification.REDmodDeploying);
  });

  test(`keeps the deployed files when a mod was added`, async () => {
    const order = vortexLoadOrderOf(`Mod X`, `Mod Y`);
    fs.readFileAsync.mockResolvedValue(`Mod X`);

    await deployREDmodForCurrentLoadOrder(makeApi(order), GAMEDIR);

    expect(fs.removeAsync).not.toHaveBeenCalled();
  });

  test(`tells the user why redMod failed`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    redmodExitsWith(1, REDMOD_FAILED_OUTPUT);

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR)).rejects.toThrow(REDMOD_FAILURE_REASON);

    expect(notificationMessagesSentTo(api)).toContainEqual(expect.stringContaining(REDMOD_FAILURE_REASON));
    expect(logLinesAt(api, `error`)).toContainEqual(expect.stringContaining(REDMOD_FAILURE_REASON));
  });

  test(`logs everything redMod said when it fails`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    redmodExitsWith(1, REDMOD_FAILED_OUTPUT);

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR)).rejects.toThrow();

    expect(logLinesAt(api, `warn`)).toContainEqual(expect.stringContaining(REDMOD_FAILED_OUTPUT));
  });

  test(`gives redMod's exit code when redMod gives no reason`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    redmodExitsWith(1, `[DEPLOY] Stage 1/5 - Initialization\r\n\r\nCommandlet deploy has failed.`);

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR)).rejects.toThrow(`REDmod exited with code 1`);
  });

  test(`tells the user when redMod was interrupted`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    redmodExitsWith(STATUS_CONTROL_C_EXIT);

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR)).rejects.toThrow(`REDmod was interrupted`);
  });

  test(`tells the user when the modlist can't be written`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    fs.renameAsync.mockRejectedValue(Object.assign(new Error(`illegal operation`), { code: `EISDIR` }));

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR))
      .rejects.toThrow(`Couldn't write modlist.txt (EISDIR)`);

    expect(spawnMock).not.toHaveBeenCalled();
  });

  test(`shows the user that a deployment is running, until it finishes`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    const api = makeApi(order);

    await deployREDmodForCurrentLoadOrder(api, GAMEDIR);

    expect(notificationIdsSentTo(api)).toContain(ActivityNotification.REDmodDeploying);
    expect(api.dismissNotification).toHaveBeenCalledWith(ActivityNotification.REDmodDeploying);
  });

  test(`stops showing a deployment that failed`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);
    redmodExitsWith(1, `could not load mod`);

    const api = makeApi(order);

    await expect(deployREDmodForCurrentLoadOrder(api, GAMEDIR)).rejects.toThrow();

    expect(api.dismissNotification).toHaveBeenCalledWith(ActivityNotification.REDmodDeploying);
  });

  test(`runs one deployment at a time when several are asked for at once`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    // Counted at spawn rather than at close, which redmodRuns can't observe.
    let running = 0;
    const alreadyRunningAtEachSpawn: number[] = [];

    spawnMock.mockImplementation(() => {
      alreadyRunningAtEachSpawn.push(running);
      running += 1;

      const run = new FakeREDmod();
      setImmediate(() => { running -= 1; run.emit(`close`, 0); });
      return run;
    });

    await Promise.all([
      deployREDmodForCurrentLoadOrder(api, GAMEDIR),
      deployREDmodForCurrentLoadOrder(api, GAMEDIR),
      deployREDmodForCurrentLoadOrder(api, GAMEDIR),
    ]);

    expect(spawnMock).toHaveBeenCalledTimes(3);
    expect(alreadyRunningAtEachSpawn).toEqual([0, 0, 0]);
  });

  test(`keeps deploying after one of them fails`, async () => {
    const api = makeApi(vortexLoadOrderOf(`Mod X`));

    const exitCodes = [1, 0];
    redmodRuns((run) => { run.emit(`close`, exitCodes.shift() ?? 0); });

    const failed = deployREDmodForCurrentLoadOrder(api, GAMEDIR).then(() => `deployed`, () => `failed`);
    const after = deployREDmodForCurrentLoadOrder(api, GAMEDIR).then(() => `deployed`, () => `failed`);

    await expect(failed).resolves.toBe(`failed`);
    await expect(after).resolves.toBe(`deployed`);
  });

});

describe(`Deploying REDmods when the game is launched`, () => {

  const launchHookFor = (
    order: VortexLoadOrder,
    activeProfile: VortexProfile = mockedActiveProfile,
    api: VortexApi = makeApi(order),
  ): ((runParameters: VortexRunParameters) => Promise<VortexRunParameters>) => {
    const vortexExt = { api } as unknown as VortexExtensionContext;

    const vortexApiLib = {
      log: jest.fn(),
      util: { UserCanceled: Error },
      selectors: {
        activeProfile: () => activeProfile,
        discoveryByGame: () => ({ path: GAMEDIR }),
      },
    };

    const { doActualWorkInTheHookAndReturnDummyParams } =
      makeREDmodDeployOnLaunchHook(vortexExt, vortexApiLib, {} as unknown as FeatureSet);

    return doActualWorkInTheHookAndReturnDummyParams;
  };

  const runParametersFor = (executable: string, args: string[] = []): VortexRunParameters => ({
    executable,
    args,
    options: {},
  });

  test(`deploys before the game starts`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    const launching = launchHookFor(order)(
      runParametersFor(path.join(GAMEDIR, GAME_EXE_RELATIVE_PATH), [`-modded`]),
    );

    await expect(launching).resolves.toMatchObject({ args: [`-modded`] });
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  test(`deploys before the prelauncher starts the game`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    await launchHookFor(order)(
      runParametersFor(path.join(GAMEDIR, REDlauncherExeRelativePath), [`-modded`]),
    );

    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  test(`deploys before the GOG client starts the game`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    await launchHookFor(order)(runParametersFor(
      GOG_CLIENT,
      [`/command=runGame`, `/gameId=${GOGAPP_ID}`, `path="${GAMEDIR}"`],
    ));

    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  test(`leaves another game's GOG launch alone`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    await launchHookFor(order)(runParametersFor(
      GOG_CLIENT,
      [`/command=runGame`, `/gameId=1207664663`, `path="/fake/other-game"`],
    ));

    expect(spawnMock).not.toHaveBeenCalled();
  });

  test(`leaves other tools alone`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    await launchHookFor(order)(runParametersFor(ANOTHER_TOOL));

    expect(spawnMock).not.toHaveBeenCalled();
  });

  test(`leaves a tool alone that merely mentions the game dir`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    await launchHookFor(order)(
      runParametersFor(ANOTHER_TOOL, [`--game`, GAMEDIR]),
    );

    expect(spawnMock).not.toHaveBeenCalled();
  });

  test(`leaves the game alone when another game is being managed`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);
    const anotherGame = { ...mockedActiveProfile, id: `other`, gameId: `skyrimse` };

    await launchHookFor(order, anotherGame)(
      runParametersFor(path.join(GAMEDIR, GAME_EXE_RELATIVE_PATH), [`-modded`]),
    );

    expect(spawnMock).not.toHaveBeenCalled();
    expect(fs.writeFileAsync).not.toHaveBeenCalled();
  });

  test(`stops the launch when the deploy fails`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);

    redmodExitsWith(1, `could not load mod`);

    const launching = launchHookFor(order)(
      runParametersFor(path.join(GAMEDIR, GAME_EXE_RELATIVE_PATH), [`-modded`]),
    );

    await expect(launching).rejects.toThrow(`REDmod deployment failed, so the game wasn't started.`);
  });

  test(`tells the user why the game wasn't started`, async () => {
    const order = vortexLoadOrderOf(`Mod X`);
    const api = makeApi(order);

    redmodExitsWith(1, REDMOD_FAILED_OUTPUT);

    const launching = launchHookFor(order, mockedActiveProfile, api)(
      runParametersFor(path.join(GAMEDIR, GAME_EXE_RELATIVE_PATH), [`-modded`]),
    );

    await expect(launching).rejects.toThrow();

    const lastNotificationMessage = notificationMessagesSentTo(api).at(-1);

    expect(lastNotificationMessage).toContain(`The game wasn't started`);
    expect(lastNotificationMessage).toContain(REDMOD_FAILURE_REASON);
  });

});
