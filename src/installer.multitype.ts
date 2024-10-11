import {
  isLeft,
} from "fp-ts/lib/Either";
import {
  isEmpty,
} from "fp-ts/lib/ReadonlyArray";
import {
  FileTree,
  sourcePaths,
} from "./filetree";
import {
  detectCanonArchiveLayoutsAllowedExternally,
  archiveCanonInstructionsAllowedForMultiType,
} from "./installer.archive";
import {
  detectCetCanonLayout,
  cetCanonLayout,
} from "./installer.cet";
import {
  promptToFallbackOrFailOnUnresolvableLayout,
} from "./installer.fallback";
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
  detectAllowedAudiowareLayouts,
  audiowareAllowedInMultiInstructions,
} from "./installer.audioware";
import {
  detectAllowedTweakXLLayouts,
  tweakXLAllowedInMultiInstructions,
} from "./installer.tweak-xl";
import {
  configXmlAllowedInMultiInstructions,
  detectAllowedConfigXmlLayouts,
} from "./installer.config.xml";
import {
  LayoutToInstructions,
  NotAllowed,
} from "./installers.layouts";
import {
  useAllMatchingLayouts,
} from "./installers.shared";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  S,
  trueish,
} from "./util.functions";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";
import {
  configJsonAllowedInMultiInstructions,
  detectAllowedConfigJsonLayouts,
} from "./installer.config.json";
import {
  FeatureSet,
  FeatureState,
} from "./features";
import {
  consolidateREDmodInstructionsForMultiType,
  detectAllowedREDmodLayoutsForMultitype,
  redmodAllowedInstructionsForMultitype,
} from "./installer.redmod";
import {
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";

// TODO:  Check whether REDmod is enabled!
// ISSUE: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/324
export const testForMultiTypeMod: V2077TestFunc = (
  api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const hasCanonCet = detectCetCanonLayout(fileTree);
  const hasCanonRed4Ext = detectRed4ExtCanonOnlyLayout(fileTree);
  const hasBasedirRed4Ext = detectRed4ExtBasedirLayout(fileTree);

  const hasAllowedREDmods = detectAllowedREDmodLayoutsForMultitype(fileTree);
  const hasAllowedRedscript = detectAllowedRedscriptLayouts(fileTree);
  const hasAllowedConfigJson = detectAllowedConfigJsonLayouts(fileTree);
  const hasAllowedConfigXml = detectAllowedConfigXmlLayouts(fileTree);
  const hasAllowedTweakXL = detectAllowedTweakXLLayouts(fileTree);
  const hasAllowedAudioware = detectAllowedAudiowareLayouts(fileTree);
  const hasAllowedArchives = detectCanonArchiveLayoutsAllowedExternally(fileTree);

  const hasAtLeastTwoTypes =
    [
      hasAllowedArchives,
      hasAllowedConfigJson,
      hasAllowedConfigXml,
      hasCanonCet,
      hasAllowedREDmods,
      hasAllowedRedscript,
      hasCanonRed4Ext,
      hasBasedirRed4Ext,
      hasAllowedTweakXL,
    ].filter(trueish).length > 1;


  if (!hasAtLeastTwoTypes) {
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
  fileTree: FileTree,
  modInfo: ModInfo,
  features: FeatureSet,
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
    modInfo.name,
    fileTree,
    allInstructionSets,
  );

  const allInstructionsDirectedByUs = allInstructionsPerLayout.flatMap(
    (result) => result.instructions,
  );

  const tweakXLInstructions =
    tweakXLAllowedInMultiInstructions(api, fileTree);

    const audiowareInstructions =
    audiowareAllowedInMultiInstructions(api, fileTree);

  const redscriptInstructions =
    redscriptAllowedInMultiInstructions(api, modInfo.name, fileTree);

  // This really should be flagged... ISSUE #324,

  const maybeREDmodInstructions = await redmodAllowedInstructionsForMultitype(api, fileTree, modInfo, features);

  // Imperative and redundant but oh well
  if (isLeft(maybeREDmodInstructions)) {
    const errorMessage = `${me}: REDmod instructions failed, canceling installation: ${maybeREDmodInstructions.left}`;

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.MultiType,
      `Can't Install MultiType Mod when the REDmod Part Fails!`,
      sourcePaths(fileTree),
    );

    api.log(`error`, errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  const enforceTagWhenREDmodPresentToAvoidConflict: FeatureSet =
    !isEmpty(maybeREDmodInstructions.right)
      ? { ...features, REDmodAutoconversionTag: FeatureState.Enabled }
      : features;

  const archiveInstructions =
    await archiveCanonInstructionsAllowedForMultiType(api, fileTree, modInfo, enforceTagWhenREDmodPresentToAvoidConflict);

  const archiveAndREDmodInstructions =
    consolidateREDmodInstructionsForMultiType(api, archiveInstructions.instructions, maybeREDmodInstructions.right);

  const allInstructions = [
    ...allPromptedInstructions,
    ...allInstructionsDirectedByUs,
    ...tweakXLInstructions.instructions,
    ...audiowareInstructions.instructions,
    ...redscriptInstructions.instructions,
    ...archiveAndREDmodInstructions,
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
