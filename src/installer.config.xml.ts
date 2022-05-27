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
  NoLayout,
  CONFIG_XML_MOD_EXTENSION,
  CONFIG_XML_MOD_BASEDIR,
  CONFIG_XML_MOD_PROTECTED_FILENAMES,
  ConfigXmlLayout,
  CONFIG_XML_MOD_PROTECTED_FILES,
  PromptedOptionalInstructions,
  NotAllowed,
} from "./installers.layouts";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  moveFromTo,
  promptBeforeContinuingWithProtectedInstructions,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType } from "./installers.types";
import { fallbackToPromptOrFailOnUnresolvableLayout } from "./installer.fallback";

// Recognizers

const matchConfigXml = (filePath: string): boolean =>
  CONFIG_XML_MOD_EXTENSION === path.extname(filePath);

export const findConfigXmlProtectedFiles = (fileTree: FileTree): string[] =>
  filesIn(CONFIG_XML_MOD_BASEDIR, matchConfigXml, fileTree).filter((xml) =>
    CONFIG_XML_MOD_PROTECTED_FILENAMES.includes(path.basename(xml)),
  );

export const findConfigXmlCanonFiles = (fileTree: FileTree): string[] =>
  filesIn(CONFIG_XML_MOD_BASEDIR, matchConfigXml, fileTree).filter(
    (xmlPath) => !CONFIG_XML_MOD_PROTECTED_FILES.includes(xmlPath),
  );

export const findConfigXmlToplevelFiles = (fileTree: FileTree): string[] =>
  filesIn(FILETREE_ROOT, matchConfigXml, fileTree).filter((xml) =>
    CONFIG_XML_MOD_PROTECTED_FILENAMES.includes(path.basename(xml)),
  );

export const detectConfigXmlProtectedLayout = (fileTree: FileTree): boolean =>
  findConfigXmlProtectedFiles(fileTree).length > 0;

export const detectConfigXmlCanonLayout = (fileTree: FileTree): boolean =>
  findConfigXmlCanonFiles(fileTree).length > 0;

export const detectConfigXmlToplevelLayout = (fileTree: FileTree): boolean =>
  findConfigXmlToplevelFiles(fileTree).length > 0;

// Layouts

const configXmlProtectedLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allProtectedConfigXmlFiles = findConfigXmlProtectedFiles(fileTree);

  if (allProtectedConfigXmlFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const allCanonConfigXmlFiles = findConfigXmlCanonFiles(fileTree);

  const allInstructions = instructionsForSameSourceAndDestPaths([
    ...allProtectedConfigXmlFiles,
    ...allCanonConfigXmlFiles,
  ]);

  return {
    kind: ConfigXmlLayout.Protected,
    instructions: allInstructions,
  };
};

const configXmlCanonLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonConfigXmlFiles = findConfigXmlCanonFiles(fileTree);

  if (allCanonConfigXmlFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: ConfigXmlLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonConfigXmlFiles),
  };
};

const configXmlTopevelLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allToplevelConfigXmlFiles = findConfigXmlToplevelFiles(fileTree);

  if (allToplevelConfigXmlFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const toplevelXMLsToBasedir = allToplevelConfigXmlFiles.map(
    moveFromTo(FILETREE_ROOT, CONFIG_XML_MOD_BASEDIR),
  );

  const movingInstructions = instructionsForSourceToDestPairs(toplevelXMLsToBasedir);

  return {
    kind: ConfigXmlLayout.Toplevel,
    instructions: movingInstructions,
  };
};

// testSupport

export const testForConfigXmlMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({
    supported:
      detectConfigXmlProtectedLayout(fileTree) ||
      detectConfigXmlCanonLayout(fileTree) ||
      detectConfigXmlToplevelLayout(fileTree),
    requiredFiles: [],
  });

// install

export const installConfigXmlMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
): Promise<VortexInstallResult> => {
  const allPossibleConfigXmlLayouts = [
    configXmlProtectedLayout,
    configXmlCanonLayout,
    configXmlTopevelLayout,
  ];
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleConfigXmlLayouts,
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return fallbackToPromptOrFailOnUnresolvableLayout(
      api,
      InstallerType.ConfigXml,
      fileTree,
    );
  }

  const userNeedsToBePrompted =
    selectedInstructions.kind === ConfigXmlLayout.Protected ||
    selectedInstructions.kind === ConfigXmlLayout.Toplevel;

  if (!userNeedsToBePrompted) {
    return Promise.resolve({
      instructions: selectedInstructions.instructions,
    });
  }

  const confirmedInstructions = await promptBeforeContinuingWithProtectedInstructions(
    api,
    InstallerType.ConfigXml,
    CONFIG_XML_MOD_PROTECTED_FILES,
    selectedInstructions,
  );

  if (confirmedInstructions === NotAllowed.CanceledByUser) {
    const cancelMessage = `${InstallerType.ConfigXml}: user chose to cancel installing to protected paths`;

    api.log(`warn`, cancelMessage);
    return Promise.reject(new Error(cancelMessage));
  }

  api.log(
    `info`,
    `${InstallerType.ConfigXml}: User confirmed installing to protected paths`,
  );
  return Promise.resolve({
    instructions: confirmedInstructions.instructions,
  });
};

//
// External use for MultiType etc.
//

const layoutsAllowedInMultiAndOtherTypes = [
  configXmlProtectedLayout,
  configXmlCanonLayout,
];
export const detectAllowedConfigXmlLayouts = (fileTree: FileTree): boolean =>
  detectConfigXmlProtectedLayout(fileTree) || detectConfigXmlCanonLayout(fileTree);

export const configXmlAllowedInMultiInstructions = async (
  api: VortexApi,
  fileTree: FileTree,
): Promise<PromptedOptionalInstructions> => {
  const me = InstallerType.ConfigXml;

  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    layoutsAllowedInMultiAndOtherTypes,
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${me}: No valid XML config files found, this is ok`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  if (selectedInstructions.kind !== ConfigXmlLayout.Protected) {
    return selectedInstructions;
  }

  const confirmedInstructions = await promptBeforeContinuingWithProtectedInstructions(
    api,
    InstallerType.ConfigXml,
    CONFIG_XML_MOD_PROTECTED_FILES,
    selectedInstructions,
  );

  if (confirmedInstructions === NotAllowed.CanceledByUser) {
    api.log(`warn`, `${me}: user did not allow installing to protected paths`);

    return NotAllowed.CanceledByUser;
  }

  return confirmedInstructions;
};
