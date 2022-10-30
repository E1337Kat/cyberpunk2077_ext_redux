import { flow } from "fp-ts/lib/function";
import { replace as replaceIn } from "fp-ts/lib/string";

export const identity = <T>(t: T): T => t;
export const trueish = <T>(t: T): boolean => !!t;
export const negate = (b: boolean): boolean => !b;

export const alwaysTrue = (): boolean => true;
export const alwaysFalse = (): boolean => false;

export const noop = (): void => undefined;

// Haha you have to do this yourself
export const exhaustiveMatchFailure = (_: never): never => {
  throw new Error(`Type guard failed`);
};

export const jsonp = (thing: unknown): string => JSON.stringify(thing);
export const jsonpp = (thing: unknown): string => JSON.stringify(thing, null, 2);

export const S = (thing: unknown): string =>
  jsonp(thing)?.replace(/(\t|\n|\r)+/gm, ` `).replace(/\\+"/gm, `"`) ?? `<failed to stringify ${thing}>`;


export const heredoc = flow(
  replaceIn(/^[ \t]+/gm, ``),     // Remove leading whitespace on each row
  replaceIn(/^\|/gm, ` `),        // Drop |'s that protected leading whitespace
  replaceIn(/\n{3,}/g, `\n\n`),   // And squash extra empty lines into one empty max
);


export const bbcodeBasics = flow(
  replaceIn(/\n{2,}/g, `\n[br][/br][br][/br]\n`), // Any number of empty lines becomes a single bbcode line break
);
