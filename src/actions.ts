// eslint-disable-next-line import/no-extraneous-dependencies
import {
  ComplexActionCreator1,
  createAction,
} from 'redux-act';

export type SettingAction = ComplexActionCreator1<boolean, boolean>;

export const setREDmodAutoconvertArchivesAction: SettingAction =
  createAction<boolean, boolean>(
    `SET_REDMOD_AUTOCONVERT_ARCHIVES`,
    (enabled: boolean): boolean => enabled,
  );
