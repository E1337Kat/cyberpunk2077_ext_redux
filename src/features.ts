export const enum Feature {
  Enabled = `This feature is enabled`,
  Disabled = `This feature is disabled`,
  Deprecated = `This feature should be removed`,
}

export interface Features {
  RedModding: Feature;
}

export const FeatureSet: Features = {
  RedModding: Feature.Disabled,
};
