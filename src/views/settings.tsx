import I18next from 'i18next';                   // eslint-disable-line import/no-extraneous-dependencies
import * as React from 'react';                  // eslint-disable-line import/no-extraneous-dependencies
import { withTranslation } from 'react-i18next'; // eslint-disable-line import/no-extraneous-dependencies
import { connect } from 'react-redux';           // eslint-disable-line import/no-extraneous-dependencies
import * as Redux from 'redux';                  // eslint-disable-line import/no-extraneous-dependencies
import { ThunkDispatch } from 'redux-thunk';     // eslint-disable-line import/no-extraneous-dependencies
import {
  More,
  Toggle,
  util as vortexUtil,
} from 'vortex-api';
import { setREDmodAutoconvertArchivesAction } from '../actions';
import {
  DynamicFeature,
  storeGetDynamicFeature,
} from '../features';
import { squashAllWhitespace } from '../util.functions';
import { VortexState } from '../vortex-wrapper';

interface IBaseProps {
  t: typeof I18next.t;
}

interface IConnectedProps {
  redmodAutoconvertArchives: boolean;
}

interface IActionProps {
  onREDmodAutoconvertArchives: (enable: boolean) => void;
}

type IProps = IBaseProps & IConnectedProps & IActionProps;

const Settings = (props: IProps): JSX.Element => {
  const {
    t,
    redmodAutoconvertArchives,
    onREDmodAutoconvertArchives,
  } = props;
  return (
    <div>
      <Toggle
        checked={redmodAutoconvertArchives}
        onToggle={onREDmodAutoconvertArchives}
      >
        {t(`Automatically convert legacy-style '.archive' mods to REDmods on install (NOT recommended)`)}
        <More
          id='red-autoconvert-setting'
          name={t(`Autoconvert old mods for Load Order`)}>
          {t(`${squashAllWhitespace(`
            Whenever you install a standard 'archive' mod, we can instead convert it to CDPR's native REDmod 
            format. This is required to use the internal load order tools, but can cause compatibility issues
            with many of the more complex mods. You can learn more about this here:\n
            https://wiki.redmodding.org/cyberpunk-2077-modding/for-mod-users/users-modding-cyberpunk-2077#mod-format-redmod-or-vanilla
            `)}\n\n`)}
        </More>
      </Toggle>
    </div>
  );
};

export const mapStateToProps = (fullVortexState: unknown): IConnectedProps => ({
  redmodAutoconvertArchives: storeGetDynamicFeature(vortexUtil, DynamicFeature.REDmodAutoconvertArchives, fullVortexState),
});


export const mapDispatchToProps = (dispatch: ThunkDispatch<VortexState, null, Redux.Action>): IActionProps => ({
  onREDmodAutoconvertArchives: (enable: boolean) => dispatch(setREDmodAutoconvertArchivesAction(enable)),
});

export default
withTranslation([`common`, `redmod-integration`])(
  connect(mapStateToProps, mapDispatchToProps)(
    Settings,
  ) as any,
) as React.ComponentClass<unknown>;
