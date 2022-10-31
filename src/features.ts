import { util } from "vortex-api";
import { VORTEX_STORE_PATHS } from "./index.metadata";
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
  featureState === ((): FeatureState => FeatureState.Enabled);

export type Dynamic<T> = () => T;

//
// Some features can be changed, some can't
//

export const enum StaticFeature {
  REDmodding = `v2077-feature-redmodding`,
  REDmodLoadOrder = `v2077-feature-redmod-load-order`,
}

// Need to be underscored since it isn't always just a string... thanks react...
export const enum DynamicFeature {
  REDmodAutoconvertArchives = `v2077_feature_redmod_autoconvert_archives`,
}

export type FeatureSettingsPathInVortex = Record<keyof typeof DynamicFeature, string[]>;


// FeatureSets are what user code uses...

export type StaticFeatureSet = Record<keyof typeof StaticFeature, FeatureState>;

export type DynamicFeatureSet = Record<keyof typeof DynamicFeature, Dynamic<FeatureState>>;

type AllFeaturesSet = StaticFeatureSet & DynamicFeatureSet;

export interface FeatureSet extends AllFeaturesSet {
  fromVersion: string;
}


// ...Through these records

export const FeatureSettingsPath: FeatureSettingsPathInVortex = {
  REDmodAutoconvertArchives: [...VORTEX_STORE_PATHS.settings, DynamicFeature.REDmodAutoconvertArchives],
};

export const BaselineFeatureSetForTests: FeatureSet = {
  fromVersion: `0.9.0`,
  REDmodding: FeatureState.Disabled,
  REDmodLoadOrder: FeatureState.Disabled,
  REDmodAutoconvertArchives: () => FeatureState.Disabled,
};

export const FeaturesFromSettings = ({ store }: VortexExtensionApi): FeatureSet => ({
  fromVersion: `0.9.0`,
  REDmodding: FeatureState.Enabled,
  REDmodLoadOrder: FeatureState.Enabled,
  REDmodAutoconvertArchives: () =>
    boolAsFeature(
      util.getSafe(store?.getState(), FeatureSettingsPath.REDmodAutoconvertArchives, false),
    ),
});

