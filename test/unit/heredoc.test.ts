import { pipe } from "fp-ts/lib/function";
import {
  bbcodeBasics,
  heredoc,
} from "../../src/installers.utils";

describe(`heredoc formatting`, () => {
  test(`converts whitespace-preserving | to single space`, () => {
    const testDoc = `
            - weeble
            |   - + beep
            |   - + baz
            - quux
            |   - + foo
            |   - + bar
            `;

    const cleanedUpDoc =
      `\n` +
      `- weeble\n` +
      `    - + beep\n` +
      `    - + baz\n` +
      `- quux\n` +
      `    - + foo\n` +
      `    - + bar\n`;

    expect(pipe(testDoc, heredoc)).toEqual(cleanedUpDoc);
  });
});


describe(`bbcode formatting`, () => {
  test(`bbcodeParagraph just adds a bbcode double break where there is at least one empty line`, () => {
    const testDoc =
      `hi\n\nthere\n\n\nwow\nno`;

    const bbcodefiedDoc =
      `hi\n[br][/br][br][/br]\nthere\n[br][/br][br][/br]\nwow\nno`;

    expect(pipe(testDoc, bbcodeBasics)).toEqual(bbcodefiedDoc);
  });
});


describe(`combining formatters`, () => {
  test(`bbcodeParagraph -> heredoc works`, () => {
    const testDoc = `
            - weeble
            |   - + beep
            |   - + baz
            - quux
            |   - + foo
            |   - + bar


            WThecc
            `;

    const cleanedUpDoc =
      `\n` +
      `- weeble\n` +
      `    - + beep\n` +
      `    - + baz\n` +
      `- quux\n` +
      `    - + foo\n` +
      `    - + bar\n` +
      `[br][/br][br][/br]\n` +
      `WThecc\n`;

    expect(pipe(testDoc, bbcodeBasics, heredoc)).toEqual(cleanedUpDoc);
  });
  test(`heredoc -> bbcode also works`, () => {
    const testDoc = `
            - weeble
            |   - + beep
            |   - + baz
            - quux
            |   - + foo
            |   - + bar


            WThecc
            `;

    const cleanedUpDoc =
      `\n` +
      `- weeble\n` +
      `    - + beep\n` +
      `    - + baz\n` +
      `- quux\n` +
      `    - + foo\n` +
      `    - + bar\n` +
      `[br][/br][br][/br]\n` +
      `WThecc\n`;

    expect(pipe(testDoc, heredoc, bbcodeBasics)).toEqual(cleanedUpDoc);
  });
});
