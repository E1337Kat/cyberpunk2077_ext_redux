import {
  types,
  util,
} from "vortex-api";
import { VortexApi } from "./vortex-wrapper";

export const enum Feature {
  Enabled = `This feature is enabled`,
  Disabled = `This feature is disabled`,
  Deprecated = `This feature should be removed`,
}

export interface Features {
  REDmodding: Feature;
  REDmodLoadOrder: Feature;
  REDmodAutoconvertArchives: Feature;
}

export const CurrentFeatureSet: Features = {
  REDmodding: Feature.Enabled,
  REDmodLoadOrder: Feature.Enabled,
  REDmodAutoconvertArchives: Feature.Enabled,
};

export const DefaultFeatureSetForTesting: Features = {
  REDmodding: Feature.Disabled,
  REDmodLoadOrder: Feature.Disabled,
  REDmodAutoconvertArchives: Feature.Disabled,
};

export const FeatureEnabled = (feature: Feature): boolean =>
  feature === Feature.Enabled;

const boolToEnabled = (currentState: boolean): Feature => (currentState ? Feature.Enabled : Feature.Disabled);

// @TODO: build features from settings
export const FeaturesFromSettings = (vortexApi: VortexApi): Features => {
  const state: types.IState = vortexApi.store.getState();
  return {
    REDmodding: CurrentFeatureSet.REDmodding,
    REDmodLoadOrder: CurrentFeatureSet.REDmodLoadOrder,
    REDmodAutoconvertArchives: boolToEnabled(util.getSafe(state, [`settings`, `V2077`, `redmod`, `archiveAutoConvert`], false)),
  };
};
