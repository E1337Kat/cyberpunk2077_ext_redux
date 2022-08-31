import { MODS_EXTRA_BASEDIR } from "./installers.layouts";
import { VortexApi, VortexNotification } from "./vortex-wrapper";

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
]);

const getInfoNotificationOrThrow = (
  api: VortexApi,
  id: InfoNotification,
): Notification => {
  const notification = InfoNotificationsUnsafeMap.get(id);

  if (notification === undefined) {
    const errorCausingAnExitHopefullyInTestsAndNotInProd = `No notification definition found for ${id}`;

    api.log(`error`, errorCausingAnExitHopefullyInTestsAndNotInProd);
    throw new Error(errorCausingAnExitHopefullyInTestsAndNotInProd);
  }

  return notification;
};

//
// Creating notifs
//

export const showInfoNotification = async (
  api: VortexApi,
  id: InfoNotification,
): Promise<NotificationStatus> => {
  api.sendNotification(getInfoNotificationOrThrow(api, id));

  return NotificationStatus.Complete;
};
