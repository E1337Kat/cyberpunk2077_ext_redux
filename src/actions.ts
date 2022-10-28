// eslint-disable-next-line import/no-extraneous-dependencies
import { createAction } from 'redux-act';

// export const setRedModEnable = createAction(`SET_REDMOD_ENABLE`, (enabled) => enabled);
export const setAutoRedDeploy = createAction(`SET_AUTO_RED_DEPLOY`, (enabled) => enabled);
export const setArchiveAutoConvert = createAction(`SET_ARCHIVE_AUTO_CONVERT`, (enabled) => enabled);
export const setRedmodForceDeploy = createAction(
  `SET_REDMOD_FORCE_DEPLOY`,
  (profileId: string, force: boolean) => ({ profileId, force }),
);
