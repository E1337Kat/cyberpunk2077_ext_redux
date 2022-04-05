// MultiType installer

import { FileTree, fileCount } from "./filetree";
import {
  detectExtraArchiveLayouts,
  extraCanonArchiveInstructions,
} from "./installer.archive";
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
import {
  detectAllowedTweakXLLayouts,
  tweakXLAllowedInMultiInstructions,
} from "./installer.tweak-xl";
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
  const hasCanonTweakXL = detectAllowedTweakXLLayouts(fileTree);

  const hasExtraArchives = detectExtraArchiveLayouts(fileTree);

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
      hasCanonTweakXL,
    ].filter(trueish).length > 1;

  // For now, let's define these specifically. Should also move
  // the special handling in CET and Reds to this mode (and then
  // I think we might also be able to unify these two if we don't
  // need to worry about the archive special cases..)
  const hasValidExtraArchives =
    hasExtraArchives && (hasCanonTweakXL || hasCanonRed4Ext || hasBasedirRed4Ext);

  if (!hasAtLeastTwoTypes && !hasValidExtraArchives) {
    api.log(`debug`, `${InstallerType.MultiType}: no multitype match`);
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  api.log(`info`, `${InstallerType.MultiType}: found multiple mod types to handle`);

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
  ];

  const allInstructionsPerLayout = useAllMatchingLayouts(
    api,
    modName,
    fileTree,
    allInstructionSets,
  );

  const allInstructionsWeProduced = allInstructionsPerLayout.flatMap(
    (i) => i.instructions,
  );

  const allInstructions = [
    ...allInstructionsWeProduced,
    ...extraCanonArchiveInstructions(api, fileTree).instructions,
    ...tweakXLAllowedInMultiInstructions(api, fileTree).instructions,
  ];

  const haveFilesOutsideSelectedInstructions =
    allInstructions.length !== fileCount(fileTree);

  if (allInstructions.length < 1 || haveFilesOutsideSelectedInstructions) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.MultiType,
      fileTree,
    );
  }

  // Should still add this..
  // warnUserIfArchivesMightNeedManualReview(api, instrs stils needed);

  api.log(`info`, `${InstallerType.MultiType}: installing`);
  api.log(`debug`, `${InstallerType.MultiType}: instructions:`, allInstructions);

  return Promise.resolve({ instructions: allInstructions });
};
