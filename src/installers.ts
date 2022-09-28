import { win32 } from "path";
import {
  fileCount,
  FileTree,
  fileTreeFromPaths,
  FILETREE_ROOT,
  sourcePaths,
  subdirNamesIn,
  subtreeFrom,
} from "./filetree";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexProgressDelegate,
  VortexExtensionContext,
  VortexTestSupportedFunc,
  VortexInstallFunc,
  VortexInstruction,
} from "./vortex-wrapper";
import { KNOWN_TOPLEVEL_DIRS, NoLayout } from "./installers.layouts";
import {
  testForCetCore,
  installCetCore,
} from "./installer.core";
import { GAME_ID } from "./index.metadata";
import {
  Installer, InstallerType, InstallerWithPriority, ModInfo, V2077InstallFunc, V2077TestFunc,
} from "./installers.types";
import { installCoreTweakXL, testForCoreTweakXL } from "./installer.core-tweak-xl";
import { testForFallback, installFallback } from "./installer.fallback";
import { installTweakXLMod, testForTweakXLMod } from "./installer.tweak-xl";
import { installCoreArchiveXL, testForCoreArchiveXL } from "./installer.core-archive-xl";
import { testForArchiveMod, installArchiveMod } from "./installer.archive";
import { testForMultiTypeMod, installMultiTypeMod } from "./installer.multitype";
import { testForAsiMod, installAsiMod } from "./installer.asi";
import { testForCetMod, installCetMod } from "./installer.cet";
import { testForIniMod, installIniMod } from "./installer.config.ini-reshade";
import { testForJsonMod, installJsonMod } from "./installer.config.json";
import { installConfigXmlMod, testForConfigXmlMod } from "./installer.config.xml";
import { testForRed4ExtMod, installRed4ExtMod } from "./installer.red4ext";
import { testForRedscriptMod, installRedscriptMod } from "./installer.redscript";
import { modInfoFromArchiveNameOrSynthetic } from "./installers.shared";
import { extraFilesAllowedInOtherModTypesInstructions } from "./installer.special.extrafiles";
import { InfoNotification, showInfoNotification } from "./ui.notifications";
import { installCoreAmm, testForCoreAmm } from "./installer.core.amm";
import { installCoreCyberCat, testForCyberCatCore } from "./installer.core.cybercat";
import { installAmmMod, testForAmmMod } from "./installer.amm";
import { installPresetMod, testForPresetMod } from "./installer.preset";
import { testCoreCsvMerge, testCoreWolvenKitCli } from "./installer.special.deprecated";
import {
  installCoreInputLoader,
  testForCoreInputLoader,
} from "./installer.core.inputloader";
import {
  installCoreCyberScript,
  testForCoreCyberScript,
} from "./installer.core.cyberscript";
import { installRed4ExtCore, testRed4ExtCore } from "./installer.core.red4ext";
import { installREDmod, testForREDmod } from "./installer.redmod";
import { installCoreRedscript, testForCoreRedscript } from "./installer.core.redscript";
import { Features } from "./features";

// Ensure we're using win32 conventions
const path = win32;

const PRIORITY_FOR_PIPELINE_INSTALLER = 30; // Fomod is 20. Leave a couple slots if someone wants in before us
const PRIORITY_STARTING_NUMBER = PRIORITY_FOR_PIPELINE_INSTALLER + 1;

// testSupported that always fails
//
export const notSupportedModType: V2077TestFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => Promise.resolve({ supported: false, requiredFiles: [] });

// install that always fails
//
export const notInstallableMod: V2077InstallFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  throw new Error(`Should never get here`);
};

// Installers

// Setup stuff, pipeline

type InstallerWithPriorityFunc =
  (prioritized: InstallerWithPriority[], installer: Installer, index: number) => InstallerWithPriority[];

// Rather than keep the order by entering numbers,
// just keep the array ordered and we tag the
// installers with priority here
const addPriorityFrom = (start: number): InstallerWithPriorityFunc => {
  const priorityAdder = (
    prioritized: InstallerWithPriority[],
    installer: Installer,
    index: number,
  ) : InstallerWithPriority[] => prioritized.concat({ priority: start + index, ...installer });

  return priorityAdder;
};

// Define the pipeline that we push mods through
// to find the correct installer. The installers
// are tried in priority order (keep them in order
// here), and the first one that returns `supported: true`
// will be used by Vortex to `install` the mod.
//
// General approach: try to detect the more specialized
// mod types first, and if none of those match, we probably
// have a simpler mod type like INI or Archive on our hands.
//
// Using Vortex parameter names here for convenience.
//
const installers: Installer[] = [
  {
    type: InstallerType.CoreCET,
    id: InstallerType.CoreCET,
    testSupported: testForCetCore,
    install: installCetCore,
  },
  {
    type: InstallerType.CoreRedscript,
    id: InstallerType.CoreRedscript,
    testSupported: testForCoreRedscript,
    install: installCoreRedscript,
  },
  {
    type: InstallerType.CoreRed4ext,
    id: InstallerType.CoreRed4ext,
    testSupported: testRed4ExtCore,
    install: installRed4ExtCore,
  },
  {
    type: InstallerType.CoreCSVMerge,
    id: InstallerType.CoreCSVMerge,
    testSupported: testCoreCsvMerge,
    install: notInstallableMod,
  },
  {
    type: InstallerType.CoreWolvenKit,
    id: InstallerType.CoreWolvenKit,
    testSupported: testCoreWolvenKitCli,
    install: notInstallableMod,
  },
  {
    type: InstallerType.CoreTweakXL,
    id: InstallerType.CoreTweakXL,
    testSupported: testForCoreTweakXL,
    install: installCoreTweakXL,
  },
  {
    type: InstallerType.CoreArchiveXL,
    id: InstallerType.CoreArchiveXL,
    testSupported: testForCoreArchiveXL,
    install: installCoreArchiveXL,
  },
  {
    type: InstallerType.CoreInputLoader,
    id: InstallerType.CoreInputLoader,
    testSupported: testForCoreInputLoader,
    install: installCoreInputLoader,
  },
  {
    type: InstallerType.CoreCyberCat,
    id: InstallerType.CoreCyberCat,
    testSupported: testForCyberCatCore,
    install: installCoreCyberCat,
  },
  {
    type: InstallerType.CoreAmm,
    id: InstallerType.CoreAmm,
    testSupported: testForCoreAmm,
    install: installCoreAmm,
  },
  {
    type: InstallerType.CoreCyberScript,
    id: InstallerType.CoreCyberScript,
    testSupported: testForCoreCyberScript,
    install: installCoreCyberScript,
  },
  {
    type: InstallerType.ASI,
    id: InstallerType.ASI,
    testSupported: testForAsiMod,
    install: installAsiMod,
  },
  {
    type: InstallerType.MultiType,
    id: InstallerType.MultiType,
    testSupported: testForMultiTypeMod,
    install: installMultiTypeMod,
  },
  {
    type: InstallerType.REDmod,
    id: InstallerType.REDmod,
    testSupported: testForREDmod,
    install: installREDmod,
  },
  {
    type: InstallerType.AMM,
    id: InstallerType.AMM,
    testSupported: testForAmmMod,
    install: installAmmMod,
  },
  {
    type: InstallerType.CET,
    id: InstallerType.CET,
    testSupported: testForCetMod,
    install: installCetMod,
  },
  {
    type: InstallerType.Redscript,
    id: InstallerType.Redscript,
    testSupported: testForRedscriptMod,
    install: installRedscriptMod,
  },
  {
    type: InstallerType.Red4Ext,
    id: InstallerType.Red4Ext,
    testSupported: testForRed4ExtMod,
    install: installRed4ExtMod,
  },
  {
    type: InstallerType.TweakXL,
    id: InstallerType.TweakXL,
    testSupported: testForTweakXLMod,
    install: installTweakXLMod,
  },
  /*
  {
    type: InstallerType.TweakDB,
    id: "cp2077-tweakdb-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
*/
  {
    type: InstallerType.INI,
    id: InstallerType.INI,
    testSupported: testForIniMod,
    install: installIniMod,
  },
  /*
  {
    type: InstallerType.LUT,
    id: "cp2077-lut-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  */
  {
    type: InstallerType.ConfigJson,
    id: InstallerType.ConfigJson,
    testSupported: testForJsonMod,
    install: installJsonMod,
  },
  {
    type: InstallerType.ConfigXml,
    id: InstallerType.ConfigXml,
    testSupported: testForConfigXmlMod,
    install: installConfigXmlMod,
  },
  {
    type: InstallerType.Preset,
    id: InstallerType.Preset,
    testSupported: testForPresetMod,
    install: installPresetMod,
  },
  {
    type: InstallerType.Archive,
    id: InstallerType.Archive,
    testSupported: testForArchiveMod,
    install: installArchiveMod,
  },
  {
    type: InstallerType.Fallback,
    id: InstallerType.Fallback,
    testSupported: testForFallback,
    install: installFallback,
  },
];

const installerPipeline: InstallerWithPriority[] = installers.reduce(
  addPriorityFrom(PRIORITY_STARTING_NUMBER),
  [],
);

const fallbackInstaller = installerPipeline[installerPipeline.length - 1];

// Let's be cautious
if (fallbackInstaller.type !== InstallerType.Fallback) {
  throw new Error(`Fallback installer not found in pipeline`);
}

//
// Install nonsense
//

const detectGiftwrapLayout = (fileTree: FileTree) : boolean => {
  const toplevelDirs = subdirNamesIn(FILETREE_ROOT, fileTree);

  if (toplevelDirs.length !== 1) {
    return false;
  }

  const toplevelDir = toplevelDirs[0];

  const allFirstLevelSubdirs = subdirNamesIn(toplevelDir, fileTree);

  if (allFirstLevelSubdirs.length < 1) {
    return false;
  }

  const subdirsMatchingKnownToplevelSubdirs = allFirstLevelSubdirs.filter((dir) =>
    KNOWN_TOPLEVEL_DIRS.includes(dir));

  if (allFirstLevelSubdirs.length === subdirsMatchingKnownToplevelSubdirs.length) {
    return true;
  }

  // For now, we’ll allow files to exist at toplevel
  // since we do have a reasonable indication the
  // top of the mod is a wrapper
  return false;
};

const enum Transform {
  Unwrapped = `Tree with extra top-level directory removed`,
  None = `No transforms`,
}

// This is probably nonsense especially since we're not giving
// these types the *actual* transform to complete whenever. That's
// just way overkill for this problem, but result is that this is
// kind of a half-assed type for nothing more than a bit of safety.
interface NotModifiedFileTree {
  readonly transform: Transform.None;
  readonly fileTree: FileTree;
}

interface UnwrappedFileTree {
  readonly transform: Transform.Unwrapped;
  readonly fileTree: FileTree;
  readonly originalTree: FileTree;
  readonly wrapperDir: string;
}

type ProcessedFileTree = NotModifiedFileTree | UnwrappedFileTree;

const unwrapTreeIfNecessary = (api: VortexApi, fileTree: FileTree): ProcessedFileTree => {
  const haveGiftwrappedMod = detectGiftwrapLayout(fileTree);

  const wrapperDir = subdirNamesIn(FILETREE_ROOT, fileTree)[0];

  const transformedTree = haveGiftwrappedMod
    ? subtreeFrom(wrapperDir, fileTree)
    : fileTree;

  const unwrappedPaths = sourcePaths(transformedTree);

  if (haveGiftwrappedMod) {
    api.log(`info`, `Mod was giftwrapped, unwrapped it for install.`);
    api.log(`debug`, `Using unwrapped filetree: `, unwrappedPaths);

    const unwrappedTree : UnwrappedFileTree = {
      transform: Transform.Unwrapped,
      fileTree: transformedTree,
      originalTree: fileTree,
      wrapperDir,
    };

    return unwrappedTree;
  }

  const unmodifiedTree: NotModifiedFileTree = {
    transform: undefined,
    fileTree,
  };

  return unmodifiedTree;
};

const giftwrapSourcesAgainIfNecessary = (
  api: VortexApi,
  treeInUse: ProcessedFileTree,
  instructions: VortexInstruction[],
): VortexInstruction[] =>
  (treeInUse.transform === Transform.Unwrapped
    ? instructions.map(({ type, source, destination }: VortexInstruction) => ({
      type,
      source: path.join(treeInUse.wrapperDir, source),
      destination,
    }))
    : instructions);

//
// (wrap) `testSupported`
//
//  Before hitting actual installers(s), make sure the tree is the way
//  we want it to be - no extra toplevel dir for example.
//
//  Also passes in some extra data like `VortexApi` and our `FileTree`.
//
//  @type `VortexTestSupportedFunc`
//
export const wrapTestSupported =
  (
    vortex: VortexExtensionContext,
    vortexApiThing,
    installer: Installer,
  ): VortexTestSupportedFunc =>
    (files: string[], gameId: string) => {
    //
      const vortexLog: VortexLogFunc = vortexApiThing.log;
      const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

      if (gameId !== GAME_ID) {
        vortexApi.log(`error`, `Not a ${GAME_ID} mod: ${gameId}`);
        return Promise.resolve({ supported: false, requiredFiles: [] });
      }

      vortexApi.log(`info`, `Testing for ${installer.type}`);
      vortexApi.log(`debug`, `Input files: `, files);

      const treeForTesting = unwrapTreeIfNecessary(vortexApi, fileTreeFromPaths(files));

      // Unlike in `install`, Vortex doesn't supply us the mod's disk path
      return installer.testSupported(
        vortexApi,
        vortexLog,
        sourcePaths(treeForTesting.fileTree),
        treeForTesting.fileTree,
      );
    };

//
//  (wrap) `install`
//
//  Before hitting actual installer(s), make sure the tree is the way
//  we want it to be - no extra toplevel dir for example.
//
//  Also passes in some extra data like `VortexApi` and our `FileTree`,
//  and loses some unnecessary stuff.
//
//  @type `VortexInstallFunc`
//

export const wrapInstall =
  (
    vortex: VortexExtensionContext,
    vortexApiThing,
    installer: Installer,
    features: Features,
  ): VortexInstallFunc =>
    async (
      files: string[],
      destinationPath: string,
      _gameId: string,
      progressDelegate: VortexProgressDelegate,
    ): Promise<VortexInstallResult> => {
    //
      const vortexLog: VortexLogFunc = vortexApiThing.log;
      const vortexApi: VortexApi = { ...vortex.api, log: vortexLog };

      vortexApi.log(`info`, `Trying to install using ${installer.type}`);
      vortexApi.log(`debug`, `Input files:`, files);

      const treeForInstallers = unwrapTreeIfNecessary(vortexApi, fileTreeFromPaths(files));
      const sourceFileCount = fileCount(treeForInstallers.fileTree);

      const stagingDirPathForMod = path.join(
        path.dirname(destinationPath),
        path.basename(destinationPath, `.installing`),
      );

      const sourceDirPathForMod = destinationPath; // Seriously wtf Vortex

      const modInfo = modInfoFromArchiveNameOrSynthetic(stagingDirPathForMod);
      vortexApi.log(`info`, `Parsed or generated mod info: `, modInfo);

      const modName =
        modInfo.name;

      const instructionsFromInstaller = await installer.install(
        vortexApi,
        vortexLog,
        sourcePaths(treeForInstallers.fileTree),
        treeForInstallers.fileTree,
        destinationPath,
        progressDelegate,
        sourceDirPathForMod,
        stagingDirPathForMod,
        modName,
        modInfo,
        features,
      );

      const allSourceFilesAccountedFor =
      instructionsFromInstaller.instructions.length >= sourceFileCount;

      const extraFilesInstructions = allSourceFilesAccountedFor
        ? { kind: NoLayout.Optional, instructions: [] }
        : extraFilesAllowedInOtherModTypesInstructions(
          vortexApi,
          modName,
          treeForInstallers.fileTree,
        );

      const allInstructionsWeKnowHowToGenerate = [
        ...instructionsFromInstaller.instructions,
        ...extraFilesInstructions.instructions,
      ];

      const stillMissingSourceFiles =
      allInstructionsWeKnowHowToGenerate.length < sourceFileCount;

      if (stillMissingSourceFiles) {
      // If we want to handle cases where we're intentionally returning
      // fewer files for some reason, need to add a type for those.
      //
        vortexApi.log(
          `error`,
          `There are fewer instructions than source files, meaning we're missing files. Reverting to Fallback!`,
          {
            sourcePaths: sourcePaths(treeForInstallers.fileTree),
            instructionSources: allInstructionsWeKnowHowToGenerate.map(
              (instruction) => instruction.source,
            ),
          },
        );
        vortexApi.log(`info`, `instructions generated by ${InstallerType.Fallback}`);
      } else {
        vortexApi.log(`info`, `instructions generated by ${installer.type}`);
      }

      const finalInstructions = !stillMissingSourceFiles
        ? allInstructionsWeKnowHowToGenerate
        : (
          await fallbackInstaller.install(
            vortexApi,
            vortexApi.log,
            sourcePaths(treeForInstallers.fileTree),
            treeForInstallers.fileTree,
            destinationPath,
            progressDelegate,
            sourceDirPathForMod,
            stagingDirPathForMod,
            modName,
            modInfo,
            features,
          )
        ).instructions;

      const instructionsFromFullyResolvedSources = giftwrapSourcesAgainIfNecessary(
        vortexApi,
        treeForInstallers,
        finalInstructions,
      );

      // Delay this until we know we're succeeding. Probably needs a better mechanism,
      // but hopefully we don't need to start queuing notifs.
      if (extraFilesInstructions.instructions.length > 0) {
        await showInfoNotification(vortexApi, InfoNotification.InstallerExtraFilesMoved);
      }

      return Promise.resolve({
        instructions: instructionsFromFullyResolvedSources,
      });
    };

// Test in ~~production~~ install!
//
// Seriously though, this does mean that nothing will run
// after us. Anything that for some reason wants to be run
// for CP2077 mods will need to run in the priority slots
// before ours.
//
// Doing this avoids having to match the installer twice,
// but if it turns out to be necessary... well, we can just
// do that, then.
const testUsingPipelineOfInstallers: V2077TestFunc = async (
  _vortexApi: VortexApi,
  _vortexLog: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => Promise.resolve({ supported: true, requiredFiles: [] });

//
// Installer that tries each actual installer in the pipeline in
// turn (by priority) for `testSupport` on the mod. If an installer
// is found, it's used to get the instructions. If not: error.
//
const installUsingPipelineOfInstallers: V2077InstallFunc = async (
  vortexApi: VortexApi,
  vortexLog: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  destinationPath: string,
  progressDelegate: VortexProgressDelegate,
  sourceDirPathForMod: string,
  stagingDirPathForMod: string,
  modName: string,
  modInfo: ModInfo,
  features: Features,
): Promise<VortexInstallResult> => {
  const me = InstallerType.Pipeline;

  // Technically I guess we could use Layouts here, one wrapped and
  // one unwrapped.. dunno if that'd make it much cleaner, maybe worth it
  let matchingInstaller: Installer;

  // Let it reject

  // eslint-disable-next-line no-restricted-syntax
  for (const candidateInstaller of installerPipeline) {
    vortexApi.log(`debug`, `${me}: Trying ${candidateInstaller.type}`);
    // eslint-disable-next-line no-await-in-loop
    const testResult = await candidateInstaller.testSupported(
      vortexApi,
      vortexLog,
      sourcePaths(fileTree),
      fileTree,
      destinationPath,
      sourceDirPathForMod,
      stagingDirPathForMod,
      modName,
      modInfo,
      features,
    );

    if (testResult.supported === true) {
      vortexApi.log(`info`, `${me}: using ${candidateInstaller.type}`);
      matchingInstaller = candidateInstaller;
      break;
    }
  }

  // Maybe this check doesn't really belong here? Can we assume this?
  // Guess we'll know, at least.
  if (matchingInstaller === undefined) {
    const errorMessage = `${me}: no installer matched this mod (this should never happen!)`;
    vortexApi.log(`error`, errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  const selectedInstructions = await matchingInstaller.install(
    vortexApi,
    vortexLog,
    sourcePaths(fileTree),
    fileTree,
    sourceDirPathForMod,
    progressDelegate,
    sourceDirPathForMod,
    stagingDirPathForMod,
    modName,
    modInfo,
    features,
  );

  vortexApi.log(`info`, `${me}: instructions generated by ${matchingInstaller.type}`);

  return Promise.resolve({
    instructions: selectedInstructions.instructions,
  });
};

export const internalPipelineInstaller: InstallerWithPriority = {
  priority: PRIORITY_FOR_PIPELINE_INSTALLER,
  type: InstallerType.Pipeline,
  id: InstallerType.Pipeline,
  testSupported: testUsingPipelineOfInstallers,
  install: installUsingPipelineOfInstallers,
};
