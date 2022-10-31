import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import * as actions from './actions';

/**
 * reducer for changes to ephemeral session state
 */
const settingsReducer: vortexApi.types.IReducerSpec = {
  reducers: {
    [actions.setArchiveAutoConvert as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`v2077_feature_redmod_autoconvert_archives`], payload),
    [actions.setRedmodForceDeploy as any]: (state, payload) =>
      vortexApi.util.setSafe(state, [`redmodForceDeploy`, payload.profileId], payload.force),
  },
  defaults: {
    archiveAutoConvert: false,
    redmodForceDeploy: {},
  },
};

export default settingsReducer;
