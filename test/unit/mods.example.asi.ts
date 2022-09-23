import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ASI_PREFIXES,
  ASI_PREFIX,
  CET_PREFIXES,
  CET_PREFIX,
  CET_INIT,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const AsiModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    asiModWithCet: {
      expectedInstallerType: InstallerType.ASI,
      inFiles: [
        ...ASI_PREFIXES,
        `${ASI_PREFIX}/DiscordRPCHelper.asi`,
        `${ASI_PREFIX}/discord_game_sdk.dll`,
        ...CET_PREFIXES,
        `${CET_PREFIX}/CP77 Discord RPC/`,
        `${CET_PREFIX}/CP77 Discord RPC/${CET_INIT}`,
        `${CET_PREFIX}/CP77 Discord RPC/GameUI.lua`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`${ASI_PREFIX}/DiscordRPCHelper.asi`),
          destination: path.normalize(`${ASI_PREFIX}/DiscordRPCHelper.asi`),
        },
        {
          type: `copy`,
          source: path.normalize(`${ASI_PREFIX}/discord_game_sdk.dll`),
          destination: path.normalize(`${ASI_PREFIX}/discord_game_sdk.dll`),
        },
        {
          type: `copy`,
          source: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/${CET_INIT}`),
          destination: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/${CET_INIT}`),
        },
        {
          type: `copy`,
          source: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/GameUI.lua`),
          destination: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/GameUI.lua`),
        },
      ],
    },
    standardAsiMod: {
      expectedInstallerType: InstallerType.ASI,
      inFiles: [...ASI_PREFIXES, `${ASI_PREFIX}/normal.asi`].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`${ASI_PREFIX}/normal.asi`),
          destination: path.normalize(`${ASI_PREFIX}/normal.asi`),
        },
      ],
    },
  }),
);
const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(AsiModSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;
