import { notEmpty, mockDeep, DeepMockProxy } from "jest-mock-extended";
import mockFs from "mock-fs";
import { IState } from "vortex-api/lib/types/IState";
import { InstallChoices } from "../../src/ui.dialogs";
import { GAME_ID } from "../../src/index.metadata";
import { internalPipelineInstaller, wrapInstall } from "../../src/installers";
import { VortexDialogResult, VortexExtensionContext } from "../../src/vortex-wrapper";

import { FAKE_STAGING_PATH, getMockVortexLog, sortByDestination } from "./utils.helper";

import {
  AllExpectedDirectFailures,
  AllExpectedInstallPromptables,
  AllExpectedSuccesses,
} from "./mods.example";
import { CurrentFeatureSet } from "../../src/features";

// Should switch this to compute the path in case changed, but eh..
/*
const fakeModZipfileStructure = FAKE_STAGING_PATH.split(path.sep).reduceRight<object>(
  (subDir: object, dir: string) => Object.fromEntries([[dir, subDir]]),
  fakeStagingDirContent,
);
*/

const DEFAULT_FEATURES = CurrentFeatureSet;

describe(`Transforming modules to instructions`, () => {
  afterEach(() => { mockFs.restore(); });

  AllExpectedSuccesses.forEach((examples, set) => {
    describe(`${set} mods`, () => {
      examples.forEach(async (mod, desc) => {
        test(`produce the expected instructions when ${desc}`, async () => {
          if (mod.fsMocked) {
            mockFs.restore();
            mockFs(mod.fsMocked);
          }
          //
          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          const stateMock = mockVortexExtensionContext.api.getState.calledWith();

          const mockState: DeepMockProxy<IState> = mockDeep<IState>({
            settings: { automation: { enable: true, deploy: true } },
          });

          stateMock.mockReturnValue(mockState);

          const dialogMock = mockVortexExtensionContext.api.showDialog.calledWith(
            notEmpty(),
            notEmpty(),
            notEmpty(),
            notEmpty(),
          );

          dialogMock.mockResolvedValue(true);

          const notificationMock =
            mockVortexExtensionContext.api.sendNotification.calledWith(notEmpty());

          notificationMock.mockReturnValue(`this doesn't actually matter, the call does`);

          const emitAndAwaitMock = mockVortexExtensionContext.api.emitAndAwait.calledWith(
            notEmpty(),
            notEmpty(),
          );
          emitAndAwaitMock.mockResolvedValue(`Irrelevant`);

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog() },
            internalPipelineInstaller,
            DEFAULT_FEATURES,
          );

          const installResult = await wrappedInstall(
            mod.inFiles,
            FAKE_STAGING_PATH,
            GAME_ID,
            null,
          );

          const gotInstructionsSorted = sortByDestination(installResult.instructions);
          const expectedInstructionsSorted = sortByDestination(mod.outInstructions);

          expect(gotInstructionsSorted).toEqual(expectedInstructionsSorted);

          if (mod.infoDialogTitle) {
            const actualCalls = dialogMock.mock.calls;

            expect(actualCalls.length).toBe(1);
            expect(actualCalls[0][0]).toBe(`info`);
            expect(actualCalls[0][1]).toBe(mod.infoDialogTitle);
          }

          if (mod.infoNotificationId) {
            const actualCalls = notificationMock.mock.calls;

            expect(actualCalls.length).toBe(1);
            expect(actualCalls[0][0].id).toBe(mod.infoNotificationId);
          }
        });
      });
    });
  });

  AllExpectedInstallPromptables.forEach((examples, set) => {
    describe(`install attempts that should prompt to proceed/cancel, ${set}`, () => {
      examples.forEach(async (mod, desc) => {
        test(`proceeds to install when choosing to proceed on ${desc}`, async () => {
          if (mod.fsMocked) {
            mockFs.restore();
            mockFs(mod.fsMocked);
          }

          const mockResult: VortexDialogResult = {
            action: InstallChoices.Proceed,
            input: undefined,
          };

          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          mockVortexExtensionContext.api.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve<VortexDialogResult>(mockResult));

          const notificationMock =
            mockVortexExtensionContext.api.sendNotification.calledWith(notEmpty());

          notificationMock.mockReturnValue(`this doesn't actually matter, the call does`);

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog() },
            internalPipelineInstaller,
            DEFAULT_FEATURES,
          );

          const installResult = await wrappedInstall(
            mod.inFiles,
            FAKE_STAGING_PATH,
            GAME_ID,
            null,
          );

          const gotInstructionsSorted = sortByDestination(installResult.instructions);
          const expectedInstructionsSorted = sortByDestination(
            mod.proceedOutInstructions,
          );

          expect(gotInstructionsSorted).toEqual(expectedInstructionsSorted);
        });

        test(`rejects the install when choosing to cancel on ${desc}`, async () => {
          if (mod.fsMocked) {
            mockFs.restore();
            mockFs(mod.fsMocked);
          }

          const mockResult: VortexDialogResult = {
            action: InstallChoices.Cancel,
            input: undefined,
          };

          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          mockVortexExtensionContext.api.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve<VortexDialogResult>(mockResult));

          const notificationMock =
            mockVortexExtensionContext.api.sendNotification.calledWith(notEmpty());

          notificationMock.mockReturnValue(`this doesn't actually matter, the call does`);

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog() },
            internalPipelineInstaller,
            DEFAULT_FEATURES,
          );

          const expectation = expect(
            wrappedInstall(mod.inFiles, FAKE_STAGING_PATH, GAME_ID, null),
          );

          await expectation.rejects.toThrowError(new Error(mod.cancelErrorMessage));
        });
      });
    });
  });

  AllExpectedDirectFailures.forEach((examples, set) => {
    describe(`mods that installers reject without prompt, ${set}`, () => {
      examples.forEach((mod, desc) => {
        test(`rejects the install outright when ${desc}`, async () => {
          if (mod.fsMocked) {
            mockFs.restore();
            mockFs(mod.fsMocked);
          }

          //
          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          const dialogMock = mockVortexExtensionContext.api.showDialog.calledWith(
            notEmpty(),
            notEmpty(),
            notEmpty(),
            notEmpty(),
          );

          dialogMock.mockResolvedValue(true);

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog() },
            internalPipelineInstaller,
            DEFAULT_FEATURES,
          );

          const expectation = expect(
            wrappedInstall(mod.inFiles, FAKE_STAGING_PATH, GAME_ID, null),
          );

          await expectation.rejects.toThrowError(new Error(mod.failure));

          if (mod.errorDialogTitle) {
            const actualCalls = dialogMock.mock.calls;

            expect(actualCalls.length).toBe(1);
            expect(actualCalls[0][0]).toBe(`error`);
            expect(actualCalls[0][1]).toBe(mod.errorDialogTitle);
          }
        }); // t
      }); // fE
    }); // d
  }); // fE
});
