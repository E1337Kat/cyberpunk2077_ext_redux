import {
  pipe,
} from "fp-ts/lib/function";
import {
  fromNullable,
  getOrElse,
  Option,
} from "fp-ts/lib/Option";
import {
  ComplexActionCreator1,
  createAction,
} from "redux-act";
import {
  FeatureSet,
  FeatureState,
  VersionedStaticFeatureSet,
  UserControlledFeatureDefaults,
  UserControlledFeature,
  boolAsFeature,
  RuntimeFeatureInitializers,
  UserControlledFeatureSet,
  RuntimeFeatureSet,
  featureAsBool,
  RuntimeFeature,
} from "./features.types";
import {
  VORTEX_STORE_PATHS,
} from "./index.metadata";
import {
  Effect,
  constant,
  forEffect,
} from "./util.functions";
import {
  VortexExtensionApi,
  VortexReducerSpec,
} from "./vortex-wrapper";

// Let's keep the single-file interface for now
export * from "./features.types";


// Default setup

export const BaselineFeatureSetForTests: FeatureSet = {
  fromVersion: `0.9.6`,
  REDmodding: constant(FeatureState.Disabled),
  REDmodLoadOrder: constant(FeatureState.Disabled),
  REDmodAutoconversionTag: constant(FeatureState.Enabled),
  REDmoddingDlc: constant(FeatureState.Enabled),
  REDmodAutoconvertArchives: constant(FeatureState.Disabled),
};

export const StaticFeaturesForStartup: VersionedStaticFeatureSet = {
  fromVersion: `0.9.6`,
  REDmodding: constant(FeatureState.Enabled),
  REDmodLoadOrder: constant(FeatureState.Enabled),
  REDmodAutoconversionTag: constant(FeatureState.Disabled),
};


//
// Helpers for the store so we don't repeat this everywhere
//

export const DefaultEnabledStateForUserControlledFeatures: UserControlledFeatureDefaults = {
  [UserControlledFeature.REDmodAutoconvertArchives]: featureAsBool(FeatureState.Disabled),
};


// wow
// much type
// such safe

interface StoreUtil {
  getSafe: any;
  setSafe: any;
}

// Subtlety here: get will get the full state, but set only gets the slice. Should reconsider.

export const storeGetRuntimeFeature =
  (storeUtil: StoreUtil, feature: RuntimeFeature, vortexState: unknown): Option<boolean> =>
    pipe(
      storeUtil.getSafe(
        vortexState,
        [...VORTEX_STORE_PATHS.settings, feature],
        undefined,
      ),
      fromNullable,
    );

const storeSetRuntimeFeature =
  (storeUtil: StoreUtil, feature: RuntimeFeature, v2077SubtreeOfVortexState: object, value: boolean): object =>
    storeUtil.setSafe(v2077SubtreeOfVortexState, [feature], value);


export const storeGetUserControlledFeature =
  (storeUtil: StoreUtil, feature: UserControlledFeature, vortexState: unknown): boolean =>
    storeUtil.getSafe(
      vortexState,
      [...VORTEX_STORE_PATHS.settings, feature],
      DefaultEnabledStateForUserControlledFeatures[feature],
    );

export const storeSetUserControlledFeature =
  (storeUtil: StoreUtil, feature: UserControlledFeature, v2077SubtreeOfVortexState: object, value: boolean): object =>
    storeUtil.setSafe(v2077SubtreeOfVortexState, [feature], value);

// Derive Redux stuff from the Features
export const makeSettingsReducerForUserControlledFeatures = (): readonly [string[], VortexReducerSpec] =>
  [VORTEX_STORE_PATHS.settings, makeSettingsReducer(DefaultEnabledStateForUserControlledFeatures)];


export type SetFeatureStateCacheAction = ComplexActionCreator1<boolean, boolean>;

export const setCachedRuntimeFeatureState: SetFeatureStateCacheAction =
  createAction<boolean, boolean>(
    `SET_REDMOD_AUTOCONVERT_ARCHIVES`,
    (enabled: boolean): boolean => enabled,
  );
// Assembling the feature set

const doEffect = <A>(e: (a: A) => void) => (a: A): A => { e(a); return a; };

const makeRuntimeFeatureGetters = (
  vortexExtApi: VortexExtensionApi,
  storeUtil: StoreUtil,
  runtimeFeatureInitializers: RuntimeFeatureInitializers,
): RuntimeFeatureSet => ({
  REDmoddingDlc: () =>
    pipe(
      // This needs to be session storage
      storeGetRuntimeFeature(
        storeUtil,
        RuntimeFeature.REDmoddingDlc,
        vortexExtApi.store.getState(),
      ),
      getOrElse(runtimeFeatureInitializers.REDmoddingDlc),
      doEffect((isFeatureOn) => {
        if (isFeatureOn) {
          vortexExtApi.store.dispatch(setCachedRuntimeFeatureState(true));
        }
      }),
      boolAsFeature,
    ),
});

const makeUserControlledFeatureGetters =
  (vortexExtApi: VortexExtensionApi, storeUtil: StoreUtil): UserControlledFeatureSet => ({
    REDmodAutoconvertArchives: () =>
      pipe(
        storeGetUserControlledFeature(
          storeUtil,
          UserControlledFeature.REDmodAutoconvertArchives,
          vortexExtApi.store.getState(),
        ),
        boolAsFeature,
      ),
  });

export const MakeCompleteFeatureSet = (
  vortexExtApi: VortexExtensionApi,
  storeUtil: StoreUtil,
  staticFeatures: VersionedStaticFeatureSet,
  runtimeFeatureInitializers: RuntimeFeatureInitializers,
): FeatureSet => ({
  ...staticFeatures,
  ...makeRuntimeFeatureGetters(vortexExtApi, storeUtil, runtimeFeatureInitializers),
  ...makeUserControlledFeatureGetters(vortexExtApi, storeUtil),
});

