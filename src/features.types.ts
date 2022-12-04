import {
  Lazy,
  Versioned,
} from "./util.functions";


//
// Features are simple things, but not as simple as booleans
//

export const enum FeatureState {
  Enabled = `This feature is enabled`,
  Disabled = `This feature is disabled`,
  Deprecated = `This feature should be removed`,
}

export const boolAsFeature = (currentState: boolean): FeatureState =>
  (currentState ? FeatureState.Enabled : FeatureState.Disabled);

export const IsFeatureEnabled = (featureState: Lazy<FeatureState>): boolean =>
  featureState() === FeatureState.Enabled;


//
// Some features are build-time static,
// Others are either lazy or dynamic and only known at runtime,
// And some of *those* are user-controlled through Settings
//

export const enum StaticFeature {
  REDmodding = `v2077_feature_redmodding`,
  REDmodLoadOrder = `v2077_feature_redmod_load_order`,
  REDmodAutoconversionTag = `v2077_feature_redmod_autoconversion_tag`,
}

// Need to be underscored since it isn't always just a string... thanks react...
export const enum DynamicFeature {
  REDmodAutoconvertArchives = `v2077_feature_redmod_autoconvert_archives`,
}


// FeatureSets are what user code uses...

export type StaticFeatureSet = Record<keyof typeof StaticFeature, Lazy<FeatureState>>;

export type DynamicFeatureSet = Record<keyof typeof DynamicFeature, Lazy<FeatureState>>;
export type DynamicFeatureDefaults = Record<DynamicFeature, boolean>;

export type VersionedStaticFeatureSet = StaticFeatureSet & Versioned;

export type FeatureSet = VersionedStaticFeatureSet & DynamicFeatureSet;
