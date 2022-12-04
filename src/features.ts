import {
  FeatureSet,
  FeatureState,
  VersionedStaticFeatureSet,
  UserControlledFeatureDefaults,
  UserControlledFeature,
  boolAsFeature,
} from "./features.types";
import {
  VORTEX_STORE_PATHS,
} from "./index.metadata";
import {
  constant,
} from "./util.functions";
import {
  VortexExtensionApi,
} from "./vortex-wrapper";

// Let's keep the single-file interface for now
export * from "./features.types";


// Default setup

export const BaselineFeatureSetForTests: FeatureSet = {
  fromVersion: `0.9.5`,
  REDmodding: constant(FeatureState.Disabled),
  REDmodLoadOrder: constant(FeatureState.Disabled),
  REDmodAutoconversionTag: constant(FeatureState.Enabled),
  REDmodAutoconvertArchives: constant(FeatureState.Disabled),
};

export const StaticFeaturesForStartup: VersionedStaticFeatureSet = {
  fromVersion: `0.9.5`,
  REDmodding: constant(FeatureState.Enabled),
  REDmodLoadOrder: constant(FeatureState.Enabled),
  REDmodAutoconversionTag: constant(FeatureState.Disabled),
};


//
// Helpers for the store so we don't repeat this everywhere
//

export const DefaultEnabledStateForUserControlledFeatures: UserControlledFeatureDefaults = {
  [UserControlledFeature.REDmodAutoconvertArchives]: false,
};


// wow
// much type
// such safe

interface StoreUtil {
  getSafe: any;
  setSafe: any;
}

// Subtlety here: get will get the full state, but set only gets the slice. Should reconsider.

export const storeGetUserControlledFeature =
  (storeUtil: StoreUtil, feature: UserControlledFeature, stateSlice: unknown): boolean => storeUtil.getSafe(
    stateSlice,
    [...VORTEX_STORE_PATHS.settings, feature],
    DefaultEnabledStateForUserControlledFeatures[feature],
  );

export const storeSetUserControlledFeature =
  (storeUtil: StoreUtil, feature: UserControlledFeature, stateSlice: object, value: boolean): object =>
    storeUtil.setSafe(stateSlice, [feature], value);

//
// Create the complete feature set once we're ready
//
// This /may/ need to be delayed because the Vortex API /object/ isn't
// permitted to be used until after the extension is initialized.
//
// One way around it might just be to use the `once()` function but
// I'm not a huge fan plus this doesn't really harm anything.. it's
// just a bit more explicit.
//

export const MakeCompleteRuntimeFeatureSet = (
  staticFeatures: VersionedStaticFeatureSet,
  vortexExtApi: VortexExtensionApi,
  storeUtil: StoreUtil, // JFC peer dependencies
): FeatureSet => ({
  ...staticFeatures,
  REDmodAutoconvertArchives: () =>
    boolAsFeature(
      storeGetUserControlledFeature(
        storeUtil,
        UserControlledFeature.REDmodAutoconvertArchives,
        vortexExtApi.store.getState(),
      ),
    ),
});

