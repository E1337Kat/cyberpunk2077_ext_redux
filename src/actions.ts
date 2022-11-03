// eslint-disable-next-line import/no-extraneous-dependencies
import { createAction } from 'redux-act';
import { EXTENSION_NAME_INTERNAL } from './index.metadata';

// export const setRedModEnable = createAction(`SET_REDMOD_ENABLE`, (enabled) => enabled);
export const setAutoRedDeploy =
  createAction(
    `SET_${EXTENSION_NAME_INTERNAL}_AUTO_RED_DEPLOY`,
    (enabled) => enabled,
  );

export const setArchiveAutoConvert =
  createAction(
    `SET_${EXTENSION_NAME_INTERNAL}_ARCHIVE_AUTO_CONVERT`,
    (enabled) => enabled,
  );

export const setRedmodForceDeploy =
  createAction(
    `SET_${EXTENSION_NAME_INTERNAL}_REDMOD_FORCE_DEPLOY`,
    (profileId: string, force: boolean) => ({ profileId, force }),
  );
