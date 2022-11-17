import {
  chain as chainE,
  Either,
  fromOption as fromOptionE,
  left,
  right,
  tryCatch as tryCatchE,
} from "fp-ts/lib/Either";
import {
  flow,
} from "fp-ts/lib/function";
import {
  Option,
  fromNullable,
} from "fp-ts/lib/Option";
import {
  isEmpty as isEmptyS,
  isString,
} from "fp-ts/lib/string";
import {
  GAME_ID,
} from "./index.metadata";
import {
  constant,
} from "./util.functions";
import {
  VortexExtensionApi,
} from "./vortex-wrapper";

export const isSupported = (gameMode: string): boolean => (gameMode === GAME_ID);


export const maybeGameDirPath =
  (api: VortexExtensionApi): Either<Error, Option<string> > =>
    tryCatchE(
      (): Option<string> => fromNullable(api.store.getState().settings.gameMode.discovered[GAME_ID].path),
      (err) => new Error(`Unable to retrieve game dir path: ${err}`),
    );

export const gameDirPath = flow(
  maybeGameDirPath,
  chainE(fromOptionE(constant(new Error(`Game dir path must be set`)))),
  chainE((maybePath) =>
    (isString(maybePath) && !isEmptyS(maybePath)
      ? right(maybePath)
      : left(new Error(`Game dir path must not be empty`)))),
);
