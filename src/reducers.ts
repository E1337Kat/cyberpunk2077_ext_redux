import { util as vortexUtil } from "vortex-api";
import * as actions from './actions';
import {
  UserControlledFeature,
  UserControlledFeatureDefaults,
  storeSetUserControlledFeature,
} from "./features";
import { VortexReducerSpec } from "./vortex-wrapper";


export const makeSettingsReducer = (settingsDefaultsUnnested: UserControlledFeatureDefaults): VortexReducerSpec => ({
  reducers: {
    [actions.setREDmodAutoconvertArchivesAction.toString()]: (stateSliceForJustOurStuff, payload: boolean) =>
      storeSetUserControlledFeature(vortexUtil, UserControlledFeature.REDmodAutoconvertArchives, stateSliceForJustOurStuff, payload),
  },
  defaults: settingsDefaultsUnnested,
});
