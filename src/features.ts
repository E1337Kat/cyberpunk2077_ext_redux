import {
  FeatureSet,
  FeatureState,
  VersionedStaticFeatureSet,
  DynamicFeatureDefaults,
  DynamicFeature,
  boolAsFeature,
} from "./features.types";
import {
  VORTEX_STORE_PATHS,
} from "./index.metadata";
import {
  VortexExtensionApi,
} from "./vortex-wrapper";

// Let's keep the single-file interface for now
export * from "./features.types";


// Default setup

export const BaselineFeatureSetForTests: FeatureSet = {
  fromVersion: `0.9.3`,
  REDmodding: FeatureState.Disabled,
  REDmodLoadOrder: FeatureState.Disabled,
  REDmodAutoconversionTag: FeatureState.Enabled,
  REDmodAutoconvertArchives: () => FeatureState.Disabled,
};

export const StaticFeaturesForStartup: VersionedStaticFeatureSet = {
  fromVersion: `0.9.3`,
  REDmodding: FeatureState.Enabled,
  REDmodLoadOrder: FeatureState.Enabled,
  REDmodAutoconversionTag: FeatureState.Disabled,
};


//
// Helpers for the store so we don't repeat this everywhere
//

export const DefaultEnabledStateForDynamicFeatures: DynamicFeatureDefaults = {
  [DynamicFeature.REDmodAutoconvertArchives]: false,
};


// wow
// much type
// such safe

interface StoreUtil {
  getSafe: any;
  setSafe: any;
}

// Subtlety here: get will get the full state, but set only gets the slice. Should reconsider.

export const storeGetDynamicFeature =
  (storeUtil: StoreUtil, feature: DynamicFeature, stateSlice: unknown): boolean => storeUtil.getSafe(
    stateSlice,
    [...VORTEX_STORE_PATHS.settings, feature],
    DefaultEnabledStateForDynamicFeatures[feature],
  );

export const storeSetDynamicFeature =
  (storeUtil: StoreUtil, feature: DynamicFeature, stateSlice: object, value: boolean): object =>
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

export const FullFeatureSetFromStaticAndDynamic = (
  staticFeatures: VersionedStaticFeatureSet,
  vortexExtApi: VortexExtensionApi,
  storeUtil: StoreUtil, // JFC peer dependencies
): FeatureSet => ({
  ...staticFeatures,
  REDmodAutoconvertArchives: () =>
    boolAsFeature(
      storeGetDynamicFeature(storeUtil, DynamicFeature.REDmodAutoconvertArchives, vortexExtApi.store.getState()),
    ),
});

