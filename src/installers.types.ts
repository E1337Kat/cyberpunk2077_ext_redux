import {
  chain as chainE,
  Either,
  left,
  mapLeft,
  match,
  right,
} from "fp-ts/lib/Either";
import * as J from "fp-ts/lib/Json";
import {
  flow,
  pipe,
} from "fp-ts/lib/function";
import * as t from "io-ts";
import {
  Option,
  fromNullable,
  getOrElse as getOrElseO,
} from "fp-ts/lib/Option";
import { FeatureSet } from "./features";
import {
  FileTree,
  Path,
} from "./filetree";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
  VortexMod,
} from "./vortex-wrapper";
import { S } from "./installers.utils";

export enum InstallerType {
  // Meta-installer, won't be in the pipeline itself
  Pipeline = `V2077 Installer Pipeline`,
  // Some special handling cases, not in the pipeline
  SpecialExtraFiles = `(Special) Extra Files Installer`,
  // 'Core' installers for the mod type enablers themselves
  CoreCET = `Core CET Installer`,
  CoreAmm = `Core Appearance Menu Mod Installer (special case of CET)`,
  CoreCyberScript = `Core CyberScript Installer`,
  CoreRedscript = `Core Redscript Installer`,
  CoreRed4ext = `Core RED4ext Installer`,
  CoreInputLoader = `Core Input Loader Installer (special case of Red4Ext)`,
  CoreCSVMerge = `(DEPRECATED - use TweakXL/ArchiveXL) Core CSVMerge Installer`,
  CoreCyberCat = `CyberCAT Save Editor Installer`,
  CoreTweakXL = `Core TweakXL Installer`,
  CoreArchiveXL = `Core ArchiveXL Installer`,
  CoreWolvenKit = `Core WolvenKitCLI Installer`,
  // MultiType
  MultiType = `MultiType Mod Installer`,
  // Mods
  ConfigJson = `JSON Config Mod Installer`,
  ConfigXml = `XML Config Mod Installer`,
  ASI = `ASI Mod Installer`,
  AMM = `AMM Mod Installer`,
  CET = `CET Mod Installer`,
  Redscript = `Redscript Mod Installer`,
  Red4Ext = `RED4ext Mod Installer`,
  REDmod = `REDmod Installer`,
  SpecialREDmodAutoconversion = `(Special) REDmod Autoconversion Installer`,
  TweakDB = `(DEPRECATED - USE TweakXL) TweakDB Mod Installer`,
  TweakXL = `TweakXL Mod Installer`,
  INI = `INI Mod Installer`,
  Reshade = `Reshade Mod Installer`,
  LUT = `LUT Mod Installer`,
  Preset = `Character Preset Installer`,
  Archive = `Archive + ArchiveXL Mod Installer`,
  // Fallback that installs everything, last in the pipeline
  Fallback = `Fallback Installer`,
  // Used as a marker
  NotSupported = `<NONEXISTING INSTALLER - THIS SHOULD NOT BE SEEN OUTSIDE TESTS>`,
}

//
// Codec helpers
//

type DecodeFromJsonFunc<A> = (json: J.Json) => Either<unknown, A>;
type SafeDecodeFunc<A> = (json: string) => Either<Error, A>;

const safeDecode = <A>(decodeFromJson: DecodeFromJsonFunc<A>): SafeDecodeFunc<A> =>
  flow(
    decodeFromJson,
    match(
      (errors) => left(new Error(`Failed to decode load order: ${S(errors)}`)),
      (ok: A) => right(ok),
    ),
  );

export const decodeWith = <A>(decodeFromJson: DecodeFromJsonFunc<A>) =>
  (jsonString: string): Either<Error, A> =>
    pipe(
      jsonString,
      J.parse,
      mapLeft((err) => new Error(`Failed to parse JSON: ${S(err)}`)),
      chainE(safeDecode(decodeFromJson)),
    );

//
// Mod Info and Name And Stuff
//

export const enum ModAttributeKey {
  ModType = `V2077_mod_attr_mod_type`,
  REDmodInfo = `V2077_mod_attr_redmod_info`,
  REDmodInfoArray = `V2077_mod_attr_redmod_info_array`,
}

export interface ModAttributeValue<T> {
  data: T;
}

export interface ModAttribute<T> {
  key: ModAttributeKey;
  value: ModAttributeValue<T>;
}

export const enum ModType {
  INVALID = `INVALID mod type used as a marker`,
  REDmod = `V2077_REDmod`,
}

// Attribute helper functions

export const makeAttr = <T>(key: ModAttributeKey, data: T): ModAttribute<T> =>
  ({ key, value: { data } });

// This should probably be an Either<Error, Option<ModAttribute<T>>..
export const attr = <T>(key: ModAttributeKey) =>
  (mod: VortexMod): Option<T> =>
    fromNullable((mod?.attributes?.[key] as ModAttributeValue<T>)?.data);

export const attrOrElse =
  <T>(key: ModAttributeKey, orElse: () => T): (mod: VortexMod) => T =>
    flow(attr<T>(key), getOrElseO(orElse));

export const attrModType =
  attrOrElse<ModType>(ModAttributeKey.ModType, () => ModType.INVALID);

export interface SemanticVersion {
  v: string;
  major: string;
  minor?: string;
  patch?: string;
  prerelease?: string;
  build?: string;
}

export interface ModInfo {
  name: string;
  id: string;
  version: SemanticVersion;
  createTime: Date;
  stagingDirPrefix: string;
  installingDir: Path;
  copy?: string;
  variant?: string;
}

// REDmod type info

// https://wiki.redmodding.org/cyberpunk-2077-modding/modding/redmod/quick-guide#parameters

// We still need to figure out if there's a need to model `mod_skip`
// at the type level rather than just in logic.
export const REDmodAudioType =
  t.keyof({
    mod_skip: null,
    mod_sfx_2d: null,
    mod_sfx_city: null,
    mod_sfx_low_occlusion: null,
    mod_sfx_occlusion: null,
    mod_sfx_radio: null,
    mod_sfx_room: null,
    mod_sfx_street: null,
  }, `REDmodAudioType`);

export type REDmodAudio = t.TypeOf<typeof REDmodAudioType>;

export const REDmodCustomSoundType =
  t.intersection([
    t.type({
      name: t.string,
      type: REDmodAudioType,
    }),
    t.partial({
      file: t.string,
      gain: t.number,
      pitch: t.number,
    }),
  ]);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface REDmodCustomSound extends t.TypeOf<typeof REDmodCustomSoundType> {}

// https://wiki.redmodding.org/cyberpunk-2077-modding/modding/redmod/quick-guide#info.json

export const REDmodInfoType =
  t.intersection([
    t.type({
      name: t.string,
      version: t.string,
    }),
    t.partial({
      description: t.string,
      customSounds: t.array(REDmodCustomSoundType),
    }),
  ], `REDmodInfoType`);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface REDmodInfo extends t.TypeOf<typeof REDmodInfoType> {}

export const decodeREDmodInfo = (json: J.Json): Either<Error, REDmodInfo> => pipe(
  json,
  REDmodInfoType.decode,
  match(
    (errors) => left(new Error(`Failed to decode REDmod info: ${errors}`)),
    (info) => right(info),
  ),
);

export interface REDmodInfoForVortex extends Pick<REDmodInfo, `name` | `version`> {
  relativePath: string;
  vortexModId: string;
}

export type REDmodInfoArrayForVortex = readonly REDmodInfoForVortex[];

export const attrREDmodInfos =
  attrOrElse<REDmodInfoArrayForVortex>(ModAttributeKey.REDmodInfoArray, () => []);

//
// Installer API functions
//

// Vortex.TestSupported
export type V2077TestFunc = (
  vortexApi: VortexApi,
  fileTree: FileTree,
  modInfo?: ModInfo,
  features?: FeatureSet,
) => Promise<VortexTestResult>;

// Vortex.InstallFunc
export type V2077InstallFunc = (
  vortexApi: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  features: FeatureSet,
) => Promise<VortexInstallResult>;

//
// Installers
//
export interface Installer {
  type: InstallerType;
  id: string;
  testSupported: V2077TestFunc;
  install: V2077InstallFunc;
}

export interface InstallerWithPriority extends Installer {
  priority: number;
}

export const enum InstallDecision {
  UserWantsToProceed = `User explicitly wants to proceed with the installation`,

  UserWantsToCancel = `User explicitly wants to cancel the installation`,
}
