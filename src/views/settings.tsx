import I18next from 'i18next';                   // eslint-disable-line import/no-extraneous-dependencies
import * as React from 'react';                  // eslint-disable-line import/no-extraneous-dependencies
import { withTranslation } from 'react-i18next'; // eslint-disable-line import/no-extraneous-dependencies
import { connect } from 'react-redux';           // eslint-disable-line import/no-extraneous-dependencies
import * as Redux from 'redux';                  // eslint-disable-line import/no-extraneous-dependencies
import { ThunkDispatch } from 'redux-thunk';     // eslint-disable-line import/no-extraneous-dependencies
import {
  More,
  Toggle,
  actions as vortexActions,
  util as vortexUtil,
} from 'vortex-api';
import {
  setREDmodAdvancedModdingFeaturesAction,
  setREDmodAutoconvertArchivesAction,
  setREDmodFallbackInstallAnywaysAction,
} from '../actions';
import {
  DynamicFeature,
  storeGetDynamicFeature,
} from '../features';
import {
  InfoNotification,
  infoNotificationOrThrow,
} from '../ui.notifications';
import { squashAllWhitespace } from '../util.functions';
import { VortexState } from '../vortex-wrapper';

interface IBaseProps {
  t: typeof I18next.t;
}

interface IConnectedProps {
  redmodAdvancedModdingFeatures: boolean;
  redmodAutoconvertArchives: boolean;
  redmodFallbackInstallAnyways: boolean;
}

interface IActionProps {
  onREDmodAdvancedModdingFeatures: (enable: boolean) => void;
  onREDmodAutoconvertArchives: (enable: boolean) => void;
  onREDmodFallbackInstallAnyways: (enable: boolean) => void;
  onWarnREDmodAdvancedFeaturesTurnedOff: () => void;
}

type IProps = IBaseProps & IConnectedProps & IActionProps;

const Settings = (props: IProps): JSX.Element => {
  const {
    t,
    redmodAdvancedModdingFeatures,
    onREDmodAdvancedModdingFeatures,
    redmodAutoconvertArchives,
    onREDmodAutoconvertArchives,
    redmodFallbackInstallAnyways,
    onREDmodFallbackInstallAnyways,
    onWarnREDmodAdvancedFeaturesTurnedOff,
  } = props;

  // Everything gated behind Advanced has to be switched off with it, otherwise
  // it'd keep running invisibly. We tell the user what we just did to them.
  const onToggleREDmodAdvancedModdingFeatures = (enable: boolean): void => {
    onREDmodAdvancedModdingFeatures(enable);

    if (!enable && redmodAutoconvertArchives) {
      onREDmodAutoconvertArchives(false);
      onWarnREDmodAdvancedFeaturesTurnedOff();
    }
  };

  return (
    <div>
      <Toggle
        checked={redmodAdvancedModdingFeatures}
        onToggle={onToggleREDmodAdvancedModdingFeatures}
      >
        {t(`Advanced Cyberpunk 2077 Modding Features (NOT recommended)`)}
        <More
          id='red-advanced-modding-features-setting'
          name={t(`Advanced Cyberpunk 2077 Modding Features`)}>
          {t(`${squashAllWhitespace(`
            Unlocks settings and tools that can break your mods if you don't know exactly what
            they do. Everything here is off by default and stays off unless you turn this on.
            Turning this back off also turns off every advanced setting it unlocked.
            `)}\n\n`)}
        </More>
      </Toggle>
      <Toggle
        checked={redmodFallbackInstallAnyways}
        onToggle={onREDmodFallbackInstallAnyways}
      >
        {t(`Don't prompt when reaching the fallback installer`)}
        <More
          id='red-fallback-install-setting'
          name={t(`Do NOT prompt on fallback installer`)}>
          {t(`${squashAllWhitespace(`
            Usually, when you are installing mods and we can't figure out what you are
            installing, we will tell you that and let you cancel to make changes or
            install anyways (and make changes after the fact). This setting hides
            the prompt we would be showing in that case. Be warned that you could end up
            installing something wrong if the mod is packaged wrong.
            `)}\n\n`)}
        </More>
      </Toggle>
      {redmodAdvancedModdingFeatures && (
        <div>
          <div>
            <h4>Advanced Cyberpunk 2077 Modding Settings</h4>
          </div>
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
                  Whenever you install a mod that contains nothing but '.archive' files, we can instead
                  convert it to CDPR's native REDmod format. This is required to use the internal load
                  order tools, but can cause compatibility issues with many of the more complex mods.
                  Mods that contain anything else - scripts, tweaks, ArchiveXL '.xl' files, or any other
                  known mod type - are never converted, because conversion moves the '.archive' files and
                  anything pointing at their old paths would break. You can learn more about this here:\n
                  https://wiki.redmodding.org/cyberpunk-2077-modding/for-mod-users/users-modding-cyberpunk-2077#mod-format-redmod-or-vanilla
                  `)}\n\n`)}
              </More>
            </Toggle>
          </div>
        </div>
      )}
    </div>
  );
};

export const mapStateToProps = (fullVortexState: unknown): IConnectedProps => ({
  redmodAdvancedModdingFeatures:
    storeGetDynamicFeature(vortexUtil, DynamicFeature.REDmodAdvancedModdingFeatures, fullVortexState),
  redmodAutoconvertArchives: storeGetDynamicFeature(vortexUtil, DynamicFeature.REDmodAutoconvertArchives, fullVortexState),
  redmodFallbackInstallAnyways:
    storeGetDynamicFeature(vortexUtil, DynamicFeature.REDmodFallbackInstallAnyways, fullVortexState),
});


export const mapDispatchToProps = (dispatch: ThunkDispatch<VortexState, null, Redux.Action>): IActionProps => ({
  onREDmodAdvancedModdingFeatures: (enable: boolean) => dispatch(setREDmodAdvancedModdingFeaturesAction(enable)),
  onREDmodAutoconvertArchives: (enable: boolean) => dispatch(setREDmodAutoconvertArchivesAction(enable)),
  onREDmodFallbackInstallAnyways: (enable: boolean) => dispatch(setREDmodFallbackInstallAnywaysAction(enable)),
  onWarnREDmodAdvancedFeaturesTurnedOff: () =>
    dispatch(vortexActions.addNotification(
      infoNotificationOrThrow(InfoNotification.REDmodAdvancedModdingFeaturesTurnedOff),
    )),
});

export default
withTranslation([`common`, `redmod-integration`])(
  connect(mapStateToProps, mapDispatchToProps)(
    Settings,
  ) as any,
) as React.ComponentClass<unknown>;
