import {
  asVortexStartHook,
} from "../../src/tools.hooks";
import {
  VortexRunParameters,
} from "../../src/vortex-wrapper";

class UserCanceled extends Error {}

const runParameters: VortexRunParameters = {
  executable: `/fake/gamedir/bin/x64/Cyberpunk2077.exe`,
  args: [`-modded`],
  options: {},
};

describe(`Start hooks as Vortex runs them`, () => {

  test(`pass on the run parameters the hook returns`, async () => {
    const hook = asVortexStartHook(async (params) => ({ ...params, args: [`-skipStartScreen`] }));

    await expect(hook(runParameters)).resolves.toMatchObject({ args: [`-skipStartScreen`] });
  });

  test(`cancel the start quietly when the hook rejects with UserCanceled`, async () => {
    const hook = asVortexStartHook(async () => {
      throw new UserCanceled(`REDmod deployment failed, so the game wasn't started.`);
    });

    const start = hook(runParameters)
      .then(() => `started`)
      .catch(UserCanceled, () => `canceled`);

    await expect(start).resolves.toBe(`canceled`);
  });

});
