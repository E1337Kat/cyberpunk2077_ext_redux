export const identity = <T>(i: T): T => i;
export const trueish = <T>(i: T): boolean => !!i;
export const negate = (b: boolean): boolean => !b;

// Haha you have to do this yourself
export const exhaustiveMatchFailure = (_: never): never => {
  throw new Error("Type guard failed");
};
