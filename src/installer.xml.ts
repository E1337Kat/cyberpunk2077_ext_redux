import path from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexProgressDelegate,
  VortexInstallResult,
} from "./vortex-wrapper";
import { FileTree, filesIn, FILETREE_ROOT } from "./filetree";
import {
  MaybeInstructions,
  NoInstructions,
  InvalidLayout,
  Instructions,
  NoLayout,
  CONFIG_XML_MOD_EXTENSION,
  CONFIG_XML_MOD_BASEDIR,
  CONFIG_XML_MOD_PROTECTED_FILENAMES,
  XMLConfigLayout,
  CONFIG_XML_MOD_PROTECTED_FILES,
} from "./installers.layouts";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  moveFromTo,
  promptToUseProtectedInstructionsOrFail,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType } from "./installers.types";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";

// Recognizers

const matchConfigXML = (filePath: string): boolean =>
  CONFIG_XML_MOD_EXTENSION === path.extname(filePath);

export const findXMLConfigProtectedFiles = (fileTree: FileTree): string[] =>
  filesIn(CONFIG_XML_MOD_BASEDIR, matchConfigXML, fileTree).filter((xml) =>
    CONFIG_XML_MOD_PROTECTED_FILENAMES.includes(path.basename(xml)),
  );

export const findXMLConfigCanonFiles = (fileTree: FileTree): string[] =>
  filesIn(CONFIG_XML_MOD_BASEDIR, matchConfigXML, fileTree).filter(
    (xmlPath) => !CONFIG_XML_MOD_PROTECTED_FILES.includes(xmlPath),
  );

export const findXMLConfigToplevelFiles = (fileTree: FileTree): string[] =>
  filesIn(FILETREE_ROOT, matchConfigXML, fileTree).filter((xml) =>
    CONFIG_XML_MOD_PROTECTED_FILENAMES.includes(path.basename(xml)),
  );

export const detectXMLConfigProtectedLayout = (fileTree: FileTree): boolean =>
  findXMLConfigProtectedFiles(fileTree).length > 0;

export const detectXMLConfigCanonLayout = (fileTree: FileTree): boolean =>
  findXMLConfigCanonFiles(fileTree).length > 0;

export const detectXMLConfigToplevelLayout = (fileTree: FileTree): boolean =>
  findXMLConfigToplevelFiles(fileTree).length > 0;

// Layouts

const xmlConfigProtectedLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allProtectedXMLConfigFiles = findXMLConfigProtectedFiles(fileTree);

  if (allProtectedXMLConfigFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const allCanonXMLConfigFiles = findXMLConfigCanonFiles(fileTree);

  const allInstructions = instructionsForSameSourceAndDestPaths([
    ...allProtectedXMLConfigFiles,
    ...allCanonXMLConfigFiles,
  ]);

  return {
    kind: XMLConfigLayout.Protected,
    instructions: allInstructions,
  };
};

const xmlConfigCanonLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonXMLConfigFiles = findXMLConfigCanonFiles(fileTree);

  if (allCanonXMLConfigFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: XMLConfigLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonXMLConfigFiles),
  };
};

const xmlConfigToplevelLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allToplevelXMLConfigFiles = findXMLConfigToplevelFiles(fileTree);

  if (allToplevelXMLConfigFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const toplevelXMLsToBasedir = allToplevelXMLConfigFiles.map(
    moveFromTo(FILETREE_ROOT, CONFIG_XML_MOD_BASEDIR),
  );

  const movingInstructions = instructionsForSourceToDestPairs(toplevelXMLsToBasedir);

  return {
    kind: XMLConfigLayout.Toplevel,
    instructions: movingInstructions,
  };
};

// testSupport

export const testForXMLConfigMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({
    supported:
      detectXMLConfigProtectedLayout(fileTree) ||
      detectXMLConfigCanonLayout(fileTree) ||
      detectXMLConfigToplevelLayout(fileTree),
    requiredFiles: [],
  });

// install

export const installXMLConfigMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
): Promise<VortexInstallResult> => {
  const allPossibleXMLConfigLayouts = [
    xmlConfigProtectedLayout,
    xmlConfigCanonLayout,
    xmlConfigToplevelLayout,
  ];
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleXMLConfigLayouts,
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.ConfigXML,
      fileTree,
    );
  }

  const userNeedsToBePrompted =
    selectedInstructions.kind === XMLConfigLayout.Protected ||
    selectedInstructions.kind === XMLConfigLayout.Toplevel;

  if (userNeedsToBePrompted) {
    return promptToUseProtectedInstructionsOrFail(
      api,
      InstallerType.ConfigXML,
      CONFIG_XML_MOD_PROTECTED_FILES,
      selectedInstructions,
    );
  }

  return Promise.resolve({
    instructions: selectedInstructions.instructions,
  });
};

//
// External use for MultiType etc.
//

export const detectAllowedXMLConfigLayouts = (fileTree: FileTree): boolean =>
  detectXMLConfigProtectedLayout(fileTree) || detectXMLConfigCanonLayout(fileTree);

export const xmlConfigAllowedInMultiInstructions = (
  _api: VortexApi,
  _fileTree: FileTree,
): Instructions => ({ kind: NoLayout.Optional, instructions: [] });
/*
  const selectedInstructions = xmlConfigCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    api.log(
      `debug`,
      `${InstallerType.ConfigXML}: No valid XML config files found, this is ok`,
    );
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return selectedInstructions;
  */
