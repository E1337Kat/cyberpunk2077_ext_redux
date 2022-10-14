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

export const s = (thing: unknown): string => JSON.stringify(thing, null, 2);
export const S = (thing: unknown): string => JSON.stringify(thing);
