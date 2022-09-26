/* eslint-disable import/first */
import path from "path";
import glob from "glob";
import * as RA from "fp-ts/ReadonlyArray";

import { pipe } from "fp-ts/lib/function";
import {
  ExampleFailingModCategory,
  ExampleSucceedingModCategory,
  ExamplePromptInstallableModCategory,
  ExamplesForType,
} from "./utils.helper";

//
// Ensure that everything gets run by looping
//

interface ExampleModSet {
  successes: Map<string, ExampleSucceedingModCategory>;
  failures: Map<string, ExampleFailingModCategory>;
  prompts: Map<string, ExamplePromptInstallableModCategory>;
}

const blankModSet: ExampleModSet = {
  successes: new Map<string, ExampleSucceedingModCategory>(),
  failures: new Map<string, ExampleFailingModCategory>(),
  prompts: new Map<string, ExamplePromptInstallableModCategory>(),
};

const allModExamples = glob.sync(`test/unit/mods.example.*.ts`);

const AllModExamplesByKind: ExampleModSet = pipe(
  allModExamples,
  RA.reduce(
    blankModSet,
    (set, exampleFile: string) => {
      const filename = path.basename(exampleFile, `.ts`);
      const kind = filename.split(`.`).slice(2).join(`.`);
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const examples: ExamplesForType = require(`./${filename}`).default;

      set.successes.set(kind, examples.AllExpectedSuccesses);
      set.failures.set(kind, examples.AllExpectedDirectFailures);
      set.prompts.set(kind, examples.AllExpectedPromptInstalls);

      return set;
    },
  ),
);

export const AllExpectedSuccesses = new Map<string, ExampleSucceedingModCategory>(
  AllModExamplesByKind.successes.entries(),
);

export const AllExpectedDirectFailures = new Map<string, ExampleFailingModCategory>(
  AllModExamplesByKind.failures.entries(),
);

export const AllExpectedInstallPromptables = new Map<
string,
ExamplePromptInstallableModCategory>(
  AllModExamplesByKind.prompts.entries(),
);
