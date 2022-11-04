import { util as vortexUtil } from "vortex-api";
import * as actions from './actions';
import {
  DynamicFeature,
  DynamicFeatureDefaults,
  storeSetDynamicFeature,
} from "./features";
import { VortexReducerSpec } from "./vortex-wrapper";


export const makeSettingsReducer = (settingsDefaultsUnnested: DynamicFeatureDefaults): VortexReducerSpec => ({
  reducers: {
    [actions.setREDmodAutoconvertArchivesAction.toString()]: (stateSliceForJustOurStuff, payload: boolean) =>
      storeSetDynamicFeature(vortexUtil, DynamicFeature.REDmodAutoconvertArchives, stateSliceForJustOurStuff, payload),
  },
  defaults: settingsDefaultsUnnested,
});
