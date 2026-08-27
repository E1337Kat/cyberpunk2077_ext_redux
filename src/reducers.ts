import { util as vortexUtil } from "@nexusmods/vortex-api";
import * as actions from './actions';
import {
  DynamicFeature,
  DynamicFeatureDefaults,
  storeSetDynamicFeature,
} from "./features";
import { VortexReducerSpec } from "./vortex-wrapper";


const LEGACY_AUTOCONVERT_SETTING_KEY = `v2077_feature_redmod_autoconvert_archives`;

export const makeSettingsReducer = (settingsDefaultsUnnested: DynamicFeatureDefaults): VortexReducerSpec => ({
  reducers: {
    [actions.setREDmodFallbackInstallAnywaysAction.toString()]: (stateSliceForJustOurStuff, payload: boolean) =>
      storeSetDynamicFeature(vortexUtil, DynamicFeature.REDmodFallbackInstallAnyways, stateSliceForJustOurStuff, payload),
    [actions.clearREDmodAutoconvertArchivesSettingAction.toString()]:
      (stateSliceForJustOurStuff): object =>
        vortexUtil.deleteOrNop(stateSliceForJustOurStuff, [LEGACY_AUTOCONVERT_SETTING_KEY]),
  },
  defaults: settingsDefaultsUnnested,
});
