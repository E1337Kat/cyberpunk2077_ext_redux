import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import * as actions from './actions';

/**
 * reducer for changes to ephemeral session state
 */
const settingsReducer: vortexApi.types.IReducerSpec = {
  reducers: {
    [actions.setRedModEnable as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`redModEnable`], payload),
    [actions.setAutoRun as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`autoRun`], payload),
    [actions.setArchiveAutoConvert as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`archiveAutoConvert`], payload),
    // [actions.setPatches as any]: (state, payload) =>
    //   util.setSafe(state, ['patches', payload.profileId], payload.patches),
    [actions.setNeedToRun as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`needToRun`, payload.profileId], payload.force),
  },
  defaults: {
    autoRun: false,
    archiveAutoConvert: false,
    // patches: {},
    needToRun: {},
  },
};

export default settingsReducer;
