import {
  Either,
  left,
  right,
  traverseArray as traverseArrayE,
} from "fp-ts/lib/Either";
import {
  flow,
  pipe,
} from "fp-ts/lib/function";
import {
  reduceRight,
} from "fp-ts/lib/ReadonlyArray";
import {
  replace as replaceIn,
} from "fp-ts/lib/string";

//
// Utility stuff. Judge /very/ carefully before adding anything here.
// This should be a small collection and very broadly usable.
//

//
// Types
//

export type Dynamic<T> = () => T;

export interface Versioned {
  fromVersion: string;
}

//
// Functions
//

// Stringification helpers

export const jsonp = (thing: unknown): string => JSON.stringify(thing);
export const jsonpp = (thing: unknown): string => JSON.stringify(thing, null, 2);

export const S = (thing: unknown): string =>
  jsonp(thing)?.replace(/(\t|\n|\r)+/gm, ` `).replace(/\\+"/gm, `"`) ?? `<failed to stringify ${thing}>`;


export const identity = <T>(t: T): T => t;
export const trueish = <T>(t: T): boolean => !!t;
export const negate = (b: boolean): boolean => !b;

export const alwaysTrue = (): boolean => true;
export const alwaysFalse = (): boolean => false;

export const constant = <T>(t: T): Dynamic<T> => () => t;

export const noop = (): void => undefined;

export type Effect = () => Either<Error, void>;

export const forEffect = <F extends () => unknown>(f: F): Effect =>
  () => {
    try {
      f();
    } catch (err) {
      return left(new Error(`forEffect-wrapped function failed: ${S(err)}`));
    }

    return right(null);
  };

export const forEachEffect = (effects: Effect[]): Either<Error, readonly void[]> =>
  pipe(
    effects,
    traverseArrayE((effect) => effect()),
  );


export type GenericRecord =
  | unknown
  | { [key: string]: GenericRecord };

export const nestedRecordFrom =
  (path: readonly string[], innermost: GenericRecord = {}): GenericRecord =>
    pipe(
      path,
      reduceRight(innermost, (key, innerRecord) => ({ [key as string]: innerRecord })),
    );

// Haha you have to do this yourself
export const exhaustiveMatchFailure = (_: never): never => {
  throw new Error(`Type guard failed`);
};


export const heredoc = flow(
  replaceIn(/^[ \t]+/gm, ``),     // Remove leading whitespace on each row
  replaceIn(/^\|/gm, ` `),        // Drop |'s that protected leading whitespace
  replaceIn(/\n{3,}/g, `\n\n`),   // And squash extra empty lines into one empty max
);

export const squashAllWhitespace = flow(
  replaceIn(/\s{2,}/g, ` `),
);

export const bbcodeBasics = flow(
  replaceIn(/\n{2,}/g, `\n[br][/br][br][/br]\n`), // Any number of empty lines becomes a single bbcode line break
);
