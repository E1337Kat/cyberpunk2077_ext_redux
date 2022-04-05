// MultiType installer

import { FileTree, fileCount } from "./filetree";
import { archiveCanonLayout, archiveHeritageLayout } from "./installer.archive";
import { detectCetCanonLayout, cetCanonLayout } from "./installer.cet";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import {
  detectRed4ExtCanonOnlyLayout,
  detectRed4ExtBasedirLayout,
  red4extBasedirLayout,
  red4extCanonLayout,
} from "./installer.red4ext";
import {
  detectRedscriptCanonOnlyLayout,
  detectRedscriptBasedirLayout,
  redscriptBasedirLayout,
  redscriptCanonLayout,
} from "./installer.redscript";
import { LayoutToInstructions } from "./installers.layouts";
import { makeSyntheticName, useAllMatchingLayouts } from "./installers.shared";
import { InstallerType } from "./installers.types";
import { trueish } from "./installers.utils";
import {
  VortexWrappedTestSupportedFunc,
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexInstallResult,
} from "./vortex-wrapper";

export const testForMultiTypeMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const hasCanonCet = detectCetCanonLayout(fileTree);
  const hasCanonRedscript = detectRedscriptCanonOnlyLayout(fileTree);
  const hasBasedirRedscript = detectRedscriptBasedirLayout(fileTree);
  const hasCanonRed4Ext = detectRed4ExtCanonOnlyLayout(fileTree);
  const hasBasedirRed4Ext = detectRed4ExtBasedirLayout(fileTree);

  // The Onlys may need better naming.. they already check that
  // there's no basedir stuff, so we can use both here without
  // additional checks.
  const hasAtLeastTwoTypes =
    [
      hasCanonCet,
      hasCanonRedscript,
      hasBasedirRedscript,
      hasCanonRed4Ext,
      hasBasedirRed4Ext,
    ].filter(trueish).length > 1;

  if (!hasAtLeastTwoTypes) {
    api.log("debug", "MultiType didn't match");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  api.log("info", "MultiType mod detected", {
    hasCanonCet,
    hasCanonRedscript,
    hasBasedirRedscript,
    hasCanonRed4Ext,
    hasBasedirRed4Ext,
  });

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installMultiTypeMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  // Should extract this to wrapper..
  const modName = makeSyntheticName(destinationPath);

  // This should be more robust. Currently we kinda rely
  // on it being very unlikely that these kinds of mods
  // are broken in ways like having canon and basedir
  // stuff but that's not guaranteed.
  //
  // Defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/96

  // Also notable: Basedirs currently *override* Canon.
  // This is probably the desired behavior but I dunno
  // if we could at least make it somehow more obvious
  // in the naming scheme.. it's clearer in specific
  // installers where we choose one layout only.
  const allInstructionSets: LayoutToInstructions[] = [
    cetCanonLayout,
    redscriptBasedirLayout,
    redscriptCanonLayout,
    red4extBasedirLayout,
    red4extCanonLayout,
    archiveCanonLayout,
    archiveHeritageLayout,
  ];

  const allInstructionsPerLayout = useAllMatchingLayouts(
    api,
    modName,
    fileTree,
    allInstructionSets,
  );

  const allInstructions = allInstructionsPerLayout.flatMap((i) => i.instructions);

  // Should still add this..
  // warnUserIfArchivesMightNeedManualReview(api, instrs stils needed);
  const haveFilesOutsideSelectedInstructions =
    allInstructions.length !== fileCount(fileTree);

  if (allInstructionsPerLayout.length < 1 || haveFilesOutsideSelectedInstructions) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.MultiType,
      fileTree,
    );
  }

  api.log("info", "MultiType installer installing files.");
  api.log("debug", "MultiType instructions: ", allInstructions);

  return Promise.resolve({ instructions: allInstructions });
};
