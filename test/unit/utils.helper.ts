/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as path from "path";
import { Console } from "console";
import { VortexInstruction } from "../../src/vortex-wrapper";

// This is the most nonsense of all nonsense, but under some
// conditions it seems to be possible for jest to override
// `console`...
//
// eslint-disable-next-line no-global-assign
console = new Console(process.stdout, process.stderr);

export const getMockVortexLog = () => {
  const mockLog = jest.fn();

  // if (process.env.DEBUG || true) {
  if (process.env.DEBUG) {
    mockLog.mockImplementation((...args) =>
      // eslint-disable-next-line no-console
      console.log(`vortex.log():`, args),
    );
  }

  return mockLog;
};

export const pathHierarchyFor = (entirePath: string): string[] => {
  const pathSegments = path.normalize(entirePath).split(path.sep);

  const hierarchy: string[] = pathSegments.reduce(
    (supers: string[], segment: string) =>
      supers.concat(path.join(supers[supers.length - 1], segment, path.sep)),
    [""],
  );

  return hierarchy.slice(1);
};

export const copiedToSamePath = (...args: string[]): VortexInstruction => ({
  type: `copy`,
  source: path.join(...args),
  destination: path.join(...args),
});

export const createdDirectory = (...args: string[]): VortexInstruction => ({
  type: `mkdir`,
  destination: path.join(...args),
});
