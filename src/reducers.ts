import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import * as actions from './actions';

/**
 * reducer for changes to ephemeral session state
 */
const settingsReducer: vortexApi.types.IReducerSpec = {
  reducers: {
    // [actions.setRedModEnable as any]: (state, payload) =>
    //   vortexApi.util.setSafe(state, [`redModEnable`], payload),
    // [actions.setAutoRedDeploy as any]: (state, payload) =>
    //   vortexApi.util.setSafe(state, [`autoRedDeploy`], payload),
    [actions.setArchiveAutoConvert as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`archiveAutoConvert`], payload),
    // [actions.setPatches as any]: (state, payload) =>
    //   util.setSafe(state, ['patches', payload.profileId], payload.patches),
    [actions.setRedmodForceDeploy as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`redmodForceDeploy`, payload.profileId], payload.force),
  },
  defaults: {
    // redModEnable: false,
    // autoRedDeploy: false,
    archiveAutoConvert: false,
    // patches: {},
    redmodForceDeploy: {},
  },
};

export default settingsReducer;
