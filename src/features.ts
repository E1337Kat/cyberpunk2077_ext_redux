export const enum Feature {
  Enabled = `This feature is enabled`,
  Disabled = `This feature is disabled`,
  Deprecated = `This feature should be removed`,
}

export interface Features {
  REDmodAutoconvertArchives: Feature;
}

export const CurrentFeatureSet: Features = {
  REDmodAutoconvertArchives: Feature.Disabled,
};
