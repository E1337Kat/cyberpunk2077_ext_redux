import { FileTree } from "./filetree";
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
  detectAllowedRedscriptLayouts,
  redscriptAllowedInMultiInstructions,
} from "./installer.redscript";
import {
  detectAllowedTweakXLLayouts,
  tweakXLAllowedInMultiInstructions,
} from "./installer.tweak-xl";
import {
  configXmlAllowedInMultiInstructions,
  detectAllowedConfigXmlLayouts,
} from "./installer.config.xml";
import { LayoutToInstructions, NotAllowed } from "./installers.layouts";
import { makeSyntheticName, useAllMatchingLayouts } from "./installers.shared";
import { InstallerType, V2077InstallFunc, V2077TestFunc } from "./installers.types";
import { trueish } from "./installers.utils";
import {

  VortexApi,
  VortexLogFunc,
  VortexTestResult,

  VortexInstallResult,
} from "./vortex-wrapper";
import {
  configJsonAllowedInMultiInstructions,
  detectAllowedConfigJsonLayouts,
} from "./installer.config.json";

export const testForMultiTypeMod: V2077TestFunc = (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const hasCanonCet = detectCetCanonLayout(fileTree);
  const hasCanonRed4Ext = detectRed4ExtCanonOnlyLayout(fileTree);
  const hasBasedirRed4Ext = detectRed4ExtBasedirLayout(fileTree);

  const hasAllowedRedscript = detectAllowedRedscriptLayouts(fileTree);
  const hasAllowedConfigJson = detectAllowedConfigJsonLayouts(fileTree);
  const hasAllowedConfigXml = detectAllowedConfigXmlLayouts(fileTree);
  const hasAllowedTweakXL = detectAllowedTweakXLLayouts(fileTree);

  const hasExtraArchives = detectExtraArchiveLayouts(fileTree);

  // The Onlys may need better naming.. they already check that
  // there's no basedir stuff, so we can use both here without
  // additional checks.
  const hasAtLeastTwoTypes =
    [
      hasAllowedConfigJson,
      hasAllowedConfigXml,
      hasCanonCet,
      hasAllowedRedscript,
      hasCanonRed4Ext,
      hasBasedirRed4Ext,
      hasAllowedTweakXL,
    ].filter(trueish).length > 1;

  // For now, let's define these specifically. Should also move
  // the special handling in CET and Reds to this mode (and then
  // I think we might also be able to unify these two if we don't
  // need to worry about the archive special cases..)
  const hasValidExtraArchives =
    hasExtraArchives && (hasAllowedTweakXL || hasCanonRed4Ext || hasBasedirRed4Ext);

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

export const installMultiTypeMod: V2077InstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const me = InstallerType.MultiType;

  // This can fail (as may others in the future), so we
  // break the usual linear execution by handling this
  // case first since it 1) it's much easier to handle
  // and 2) it's waste to process the rest if this fails.
  const promptableLayouts = [
    configJsonAllowedInMultiInstructions,
    configXmlAllowedInMultiInstructions,
  ];

  let promptedInstructionsPerLayout = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const layoutToTry of promptableLayouts) {
    const maybeInstructions = await layoutToTry(api, fileTree); // eslint-disable-line no-await-in-loop

    if (maybeInstructions === NotAllowed.CanceledByUser) {
      const cancelMessage = `${me}: user has canceled installation for some part of this mod. Can't proceed safely, canceling entirely.`;

      api.log(`error`, cancelMessage);
      return Promise.reject(new Error(cancelMessage));
    }

    promptedInstructionsPerLayout = [...promptedInstructionsPerLayout, maybeInstructions];
  }

  // Stupid no async array functions..
  const allPromptedInstructions = promptedInstructionsPerLayout.flatMap(
    (result) => result.instructions,
  );

  const modName = makeSyntheticName(destinationPath);

  // This should be made more robust, and much clearer.
  // Currently we rely on these layouts to be exclusive
  // or unlikely to break because of the order chosen
  // here.
  //
  // The XML above and Archive + TweakXL below use an
  // explicitly intended for contextless use like here,
  // so we can rely on them.
  //
  // Change the rest to work this way.
  //
  // Defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/96
  const allInstructionSets: LayoutToInstructions[] = [
    cetCanonLayout,
    red4extBasedirLayout,
    red4extCanonLayout,
  ];

  const allInstructionsPerLayout = useAllMatchingLayouts(
    api,
    modName,
    fileTree,
    allInstructionSets,
  );

  const allInstructionsDirectedByUs = allInstructionsPerLayout.flatMap(
    (result) => result.instructions,
  );

  const archiveInstructions = extraCanonArchiveInstructions(api, fileTree);
  const tweakXLInstructions = tweakXLAllowedInMultiInstructions(api, fileTree);

  const redscriptInstructions = redscriptAllowedInMultiInstructions(
    api,
    modName,
    fileTree,
  );

  const allInstructions = [
    ...allPromptedInstructions,
    ...allInstructionsDirectedByUs,
    ...archiveInstructions.instructions,
    ...tweakXLInstructions.instructions,
    ...redscriptInstructions.instructions,
  ];

  if (allInstructions.length < 1) {
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
