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
// import {
//   setArchiveAutoConvert,
//   setAutoRedDeploy,
//   setRedModEnable,
// } from '../actions';

interface IBaseProps {
  t: typeof I18next.t;
}

interface IConnectedProps {
  // redModEnable: boolean;
  // autoRedDeploy: boolean;
  archiveAutoConvert: boolean;
}

interface IActionProps {
  // onRedModEnable: (enable: boolean) => void;
  // onAutoRedDeploy: (enable: boolean) => void;
  onArchiveAutoConvert: (enable: boolean) => void;
}

type IProps = IBaseProps & IConnectedProps & IActionProps;

const Settings = (props: IProps): JSX.Element => {
  const {
    t,
    // redModEnable,
    // onRedModEnable,
    // autoRedDeploy,
    // onAutoRedDeploy,
    archiveAutoConvert,
    onArchiveAutoConvert,
  } = props;
  return (
    <div>
      {/* <Toggle
        checked={redModEnable}
        onToggle={onRedModEnable}
      >
        {t(`Enable full REDmod capabilities`)}
        <More id='red-enable-setting' name={t(`REDmodding`)}>
          {t(`REDmodding is a suite a tools to make modding the game easier for people making mods and using mods.\n\n`)}
        </More>
      </Toggle>
      <Toggle
        checked={autoRedDeploy}
        onToggle={onAutoRedDeploy}
      >
        {t(`Run REDmod deploy on Deployment Event (if necessary)`)}
        <More id='red-deploy-setting' name={t(`Running REDmod Deploy automatically`)}>
          {t(`Any time you deploy, Vortex will check if any mod containing redmods ` +
            `has changed. If so, it will run redmod.exe deployments and create or update the load order list. ` +
            `This list is used so that the load order can work correctly with new redmods.\n\n`)}
        </More>
      </Toggle> */}
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
  // redModEnable: state.settings.redmod.redModEnable,
  // autoRedDeploy: state.settings.redmod.autoRedDeploy,
  archiveAutoConvert: state.settings.v2077.redmod.archiveAutoConvert,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<VortexState, null, Redux.Action>)
: IActionProps => ({
  // onRedModEnable: (enable: boolean) => dispatch(setRedModEnable(enable)),
  // onAutoRedDeploy: (enable: boolean) => dispatch(setAutoRedDeploy(enable)),
  onArchiveAutoConvert: (enable: boolean) => dispatch(setArchiveAutoConvert(enable)),
});

export default
withTranslation([`common`, `redmod-integration`])(
  connect(mapStateToProps, mapDispatchToProps)(
    Settings,
  ) as any,
) as React.ComponentClass<unknown>;
