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
