// eslint-disable-next-line import/no-extraneous-dependencies
import {
  ComplexActionCreator1,
  createAction,
} from 'redux-act';

export type SettingAction = ComplexActionCreator1<boolean, boolean>;

export const clearREDmodAutoconvertArchivesSettingAction =
  createAction(`CLEAR_REDMOD_AUTOCONVERT_ARCHIVES_SETTING`);

export const setREDmodFallbackInstallAnywaysAction: SettingAction =
  createAction<boolean, boolean>(
    `SET_REDMOD_FALLBACK_INSTALL_ALWAYS`,
    (enabled: boolean): boolean => enabled,
  );
