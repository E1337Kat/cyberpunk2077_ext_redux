// eslint-disable-next-line import/no-extraneous-dependencies
import {
  ComplexActionCreator1,
  createAction,
} from 'redux-act';

export type SettingAction = ComplexActionCreator1<boolean, boolean>;

export const setREDmodAdvancedModdingFeaturesAction: SettingAction =
  createAction<boolean, boolean>(
    `SET_REDMOD_ADVANCED_MODDING_FEATURES`,
    (enabled: boolean): boolean => enabled,
  );

export const setREDmodAutoconvertArchivesAction: SettingAction =
  createAction<boolean, boolean>(
    `SET_REDMOD_AUTOCONVERT_ARCHIVES`,
    (enabled: boolean): boolean => enabled,
  );

export const setREDmodFallbackInstallAnywaysAction: SettingAction =
  createAction<boolean, boolean>(
    `SET_REDMOD_FALLBACK_INSTALL_ALWAYS`,
    (enabled: boolean): boolean => enabled,
  );
