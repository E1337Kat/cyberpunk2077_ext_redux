import { heredoc } from "../../src/ui.dialogs";

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
      "\n" +
      "- weeble\n" +
      "    - + beep\n" +
      "    - + baz\n" +
      "- quux\n" +
      "    - + foo\n" +
      "    - + bar" +
      "\n";

    expect(heredoc(testDoc)).toEqual(cleanedUpDoc);
  });
});
