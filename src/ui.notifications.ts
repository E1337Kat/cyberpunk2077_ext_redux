import { MODS_EXTRA_BASEDIR } from "./installers.layouts";
import {
  VortexApi,
  VortexNotification,
} from "./vortex-wrapper";

export type Notification = Required<Pick<VortexNotification, `id` | `type` | `title` | `message`>>;

export const enum NotificationStatus {
  Complete = `notification complete`,
  Incomplete = `notification incomplete (this should never happen, there is no actual state)`,
}

//
// Notification IDs - mostly necessary for being able to control a notification,
// e.g. to dismiss it, but this is also convenient for picking them.
//

export const enum InfoNotification {
  InstallerExtraFilesMoved = `V2077-notify-info-installer-extrafilesmoved`,
  CyberCatRestartRequired = `V2077-notify-info-restart-required`,
  REDmodArchiveAutoconverted = `V2077-notify-success-redmod-archive-autoconverted`,
  REDmodArchiveNOTautoconverted = `V2077-notify-info-redmod-archive-NOT-autoconverted`,
  REDmodDeploymentStarted = `V2077-notify-info-redmod-deployment-started`,
  REDmodDeploymentSucceeded = `V2077-notify-success-redmod-deployment-succeeded`,
  REDmodDeploymentFailed = `V2077-notify-error-redmod-deployment-failed`,
}

//
// Mapping IDs to actual notifs
//

const InfoNotificationsUnsafeMap = new Map<InfoNotification, Notification>([
  [
    InfoNotification.InstallerExtraFilesMoved,
    {
      id: InfoNotification.InstallerExtraFilesMoved,
      type: `info`,
      title: `Extra Files Moved To .\\${MODS_EXTRA_BASEDIR}`,
      message: `There were some extra files (usually text documentation or images) in this mod. You can find them in .\\${MODS_EXTRA_BASEDIR}`,
    },
  ],
  [
    InfoNotification.CyberCatRestartRequired,
    {
      id: InfoNotification.CyberCatRestartRequired,
      type: `info`,
      title: `Vortex Restart Required`,
      message: `To complete installing CyberCAT, wait for the deploy to finish and then restart Vortex!`,
    },
  ],
  [
    InfoNotification.REDmodArchiveAutoconverted,
    {
      id: InfoNotification.REDmodArchiveAutoconverted,
      type: `success`,
      title: `Mod Autoconverted to REDmod`,
      message: `The mod was automatically converted and will be installed as a REDmod`,
    },
  ],
  [
    InfoNotification.REDmodArchiveNOTautoconverted,
    {
      id: InfoNotification.REDmodArchiveNOTautoconverted,
      type: `info`,
      title: `Mod NOT Autoconverted to REDmod`,
      message: `The mod was NOT automatically converted and will be installed as a regular mod`,
    },
  ],
  [
    InfoNotification.REDmodDeploymentStarted,
    {
      id: InfoNotification.REDmodDeploymentStarted,
      type: `info`,
      title: `Starting REDmod Deployment`,
      message: `Running REDmod Deployment to get your mods and load order ready to go!`,
    },
  ],
  [
    InfoNotification.REDmodDeploymentSucceeded,
    {
      id: InfoNotification.REDmodDeploymentSucceeded,
      type: `success`,
      title: `REDmod Deployment Completed!`,
      message: `You're good to go, choom!`,
    },
  ],
  [
    InfoNotification.REDmodDeploymentFailed,
    {
      id: InfoNotification.REDmodDeploymentFailed,
      type: `error`,
      title: `REDmod Deployment Failed!`,
      message: `Oh no! Something went wrong with the REDmod deployment. Check Diagnostic Files for details!`,
    },
  ],
]);

const getInfoNotificationOrThrow = (
  api: VortexApi,
  id: InfoNotification,
  overrideMessage?: string,
): Notification => {
  const notification = InfoNotificationsUnsafeMap.get(id);

  if (notification === undefined) {
    const errorCausingAnExitHopefullyInTestsAndNotInProd = `No notification definition found for ${id}`;

    api.log(`error`, errorCausingAnExitHopefullyInTestsAndNotInProd);
    throw new Error(errorCausingAnExitHopefullyInTestsAndNotInProd);
  }

  const maybeModifiedNotification: Notification =
    overrideMessage
      ? { ...notification, message: overrideMessage }
      : notification;

  return maybeModifiedNotification;
};

//
// Creating notifs
//

export const showInfoNotification = async (
  api: VortexApi,
  id: InfoNotification,
  overrideMessage?: string,
): Promise<NotificationStatus> => {
  api.sendNotification(getInfoNotificationOrThrow(api, id, overrideMessage));

  return NotificationStatus.Complete;
};
