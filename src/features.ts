import { VORTEX_STORE_PATHS } from "./index.metadata";
import {
  Dynamic,
  Versioned,
} from "./util.functions";
import { VortexExtensionApi } from "./vortex-wrapper";


//
// Features are simple things, but not as simple as booleans
//

export const enum FeatureState {
  Enabled = `This feature is enabled`,
  Disabled = `This feature is disabled`,
  Deprecated = `This feature should be removed`,
}

const boolAsFeature = (currentState: boolean): FeatureState =>
  (currentState ? FeatureState.Enabled : FeatureState.Disabled);

export const IsFeatureEnabled = (featureState: FeatureState): boolean =>
  featureState === FeatureState.Enabled;

export const IsDynamicFeatureEnabled = (featureState: Dynamic<FeatureState>): boolean =>
  featureState() === FeatureState.Enabled;

//
// Some features can be changed, some can't
//

export const enum StaticFeature {
  REDmodding = `v2077_feature_redmodding`,
  REDmodLoadOrder = `v2077_feature_redmod_load_order`,
}

// Need to be underscored since it isn't always just a string... thanks react...
export const enum DynamicFeature {
  REDmodAutoconvertArchives = `v2077_feature_redmod_autoconvert_archives`,
}

export type FeatureSettingsPathInVortex = Record<keyof typeof DynamicFeature, string[]>;


// FeatureSets are what user code uses...

export type StaticFeatureSet = Record<keyof typeof StaticFeature, FeatureState>;

export type DynamicFeatureSet = Record<keyof typeof DynamicFeature, Dynamic<FeatureState>>;
export type DynamicFeatureDefaults = Record<DynamicFeature, boolean>;

export type VersionedStaticFeatureSet = StaticFeatureSet & Versioned;

export type FeatureSet = VersionedStaticFeatureSet & DynamicFeatureSet;


// ...Through these records

export const BaselineFeatureSetForTests: FeatureSet = {
  fromVersion: `0.9.0`,
  REDmodding: FeatureState.Disabled,
  REDmodLoadOrder: FeatureState.Disabled,
  REDmodAutoconvertArchives: () => FeatureState.Disabled,
};

export const StaticFeaturesForStartup: VersionedStaticFeatureSet = {
  fromVersion: `0.9.0`,
  REDmodding: FeatureState.Enabled,
  REDmodLoadOrder: FeatureState.Enabled,
};


//
// Helpers for the store so we don't repeat this everywhere
//

export const DefaultEnabledStateForDynamicFeatures: DynamicFeatureDefaults = {
  [DynamicFeature.REDmodAutoconvertArchives]: true,
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

