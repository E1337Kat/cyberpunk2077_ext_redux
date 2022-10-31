import I18next from 'i18next';                   // eslint-disable-line import/no-extraneous-dependencies
import * as React from 'react';                  // eslint-disable-line import/no-extraneous-dependencies
import { withTranslation } from 'react-i18next'; // eslint-disable-line import/no-extraneous-dependencies
import { connect } from 'react-redux';           // eslint-disable-line import/no-extraneous-dependencies
import * as Redux from 'redux';                  // eslint-disable-line import/no-extraneous-dependencies
import { ThunkDispatch } from 'redux-thunk';     // eslint-disable-line import/no-extraneous-dependencies
import {
  More,
  Toggle,
} from 'vortex-api';
import { setArchiveAutoConvert } from '../actions';
import { VortexState } from '../vortex-wrapper';

interface IBaseProps {
  t: typeof I18next.t;
}

interface IConnectedProps {
  archiveAutoConvert: boolean;
}

interface IActionProps {
  onArchiveAutoConvert: (enable: boolean) => void;
}

type IProps = IBaseProps & IConnectedProps & IActionProps;

const Settings = (props: IProps): JSX.Element => {
  const {
    t,
    archiveAutoConvert,
    onArchiveAutoConvert,
  } = props;
  return (
    <div>
      <Toggle
        checked={archiveAutoConvert}
        onToggle={onArchiveAutoConvert}
      >
        {t(`Autoconvert regular 'archive' mods to REDmods`)}
        <More
          id='red-autoconvert-setting'
          name={t(`Autoconvert old mods for Load Order`)}>
          {t(`Whenever you install a standard 'archive' mod, we can instead install it to the REDmods folder ` +
            `as if it were a RREDmod from the outset. We do this using mod magic by generating a folder and mod ` +
            `from the mod details we can glean. After autoconverting during installation, you can then use ` +
            `the mod in the load order tools.\n\n`)}
        </More>
      </Toggle>
    </div>
  );
};

const mapStateToProps = (state: any): IConnectedProps => ({
  archiveAutoConvert: state.settings.v2077.v2077_feature_redmod_autoconvert_archives,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<VortexState, null, Redux.Action>)
: IActionProps => ({
  onArchiveAutoConvert: (enable: boolean) => dispatch(setArchiveAutoConvert(enable)),
});

export default
withTranslation([`common`, `redmod-integration`])(
  connect(mapStateToProps, mapDispatchToProps)(
    Settings,
  ) as any,
) as React.ComponentClass<unknown>;
