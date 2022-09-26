import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  CORE_CET_PREFIXES,
  GAME_DIR,
  CORE_CET_FULL_PATH_DEPTH,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  mergeOrFailOnConflict,
} from "./utils.helper";

const CoreCetInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreCetInstall: {
      expectedInstallerType: InstallerType.CoreCET,
      inFiles: [
        ...CORE_CET_PREFIXES,
        path.join(`${GAME_DIR}/global.ini`),
        path.join(`${GAME_DIR}/LICENSE`),
        path.join(`${GAME_DIR}/version.dll`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`),
        path.join(`${CORE_CET_FULL_PATH_DEPTH}/json.lua`),
        path.join(`${CORE_CET_FULL_PATH_DEPTH}/LICENSE`),
        path.join(`${CORE_CET_FULL_PATH_DEPTH}/README.md`),
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${GAME_DIR}/global.ini`),
          destination: path.join(`${GAME_DIR}/global.ini`),
        },
        {
          type: `copy`,
          source: path.join(`${GAME_DIR}/LICENSE`),
          destination: path.join(`${GAME_DIR}/LICENSE`),
        },
        {
          type: `copy`,
          source: path.join(`${GAME_DIR}/version.dll`),
          destination: path.join(`${GAME_DIR}/version.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
          destination: path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
        },
        {
          type: `copy`,
          source: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`,
          ),
          destination: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`,
          ),
        },
        {
          type: `copy`,
          source: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`,
          ),
          destination: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`,
          ),
        },
        {
          type: `copy`,
          source: path.join(`${CORE_CET_FULL_PATH_DEPTH}/json.lua`),
          destination: path.join(`${CORE_CET_FULL_PATH_DEPTH}/json.lua`),
        },
        {
          type: `copy`,
          source: path.join(`${CORE_CET_FULL_PATH_DEPTH}/LICENSE`),
          destination: path.join(`${CORE_CET_FULL_PATH_DEPTH}/LICENSE`),
        },
        {
          type: `copy`,
          source: path.join(`${CORE_CET_FULL_PATH_DEPTH}/README.md`),
          destination: path.join(`${CORE_CET_FULL_PATH_DEPTH}/README.md`),
        },
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(CoreCetInstallSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;
