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
  UserControlledFeature,
  storeGetUserControlledFeature,
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
        {t(`Automatically convert old-style 'archive' mods to REDmods on install (recommended)`)}
        <More
          id='red-autoconvert-setting'
          name={t(`Autoconvert old mods for Load Order`)}>
          {t(`${squashAllWhitespace(`
            Whenever you install a standard 'archive' mod, we can instead install it to the REDmods folder
            as if it were a REDmod from the outset. We do this using mod magic by generating a folder and mod
            from the mod details we can glean. After autoconverting during installation, you can then use
            the mod in the load order tools. This process is very straightforward and should Just Work, but
            If you encounter a problem, you can always temporarily turn this setting off and install the old
            way. (And please let us know so that we can fix the problem!)
          `)}\n\n`)}
        </More>
      </Toggle>
    </div>
  );
};

export const mapStateToProps = (fullVortexState: unknown): IConnectedProps => ({
  redmodAutoconvertArchives: storeGetUserControlledFeature(vortexUtil, UserControlledFeature.REDmodAutoconvertArchives, fullVortexState),
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
