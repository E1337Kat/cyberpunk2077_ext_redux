[![Testing](https://github.com/Nexus-Mods/game-cyberpunk2077/actions/workflows/testing.yml/badge.svg)](https://github.com/Nexus-Mods/game-cyberpunk2077/actions/workflows/testing.yml) [![Package](https://github.com/Nexus-Mods/game-cyberpunk2077/actions/workflows/packaging.yml/badge.svg)](https://github.com/Nexus-Mods/game-cyberpunk2077/actions/workflows/packaging.yml)

# Cyberpunk 2077 Support for Vortex Mod Manager

- [Cyberpunk 2077 Vortex Support on Nexus](https://www.nexusmods.com/site/mods/196)
- [Repository on Github](https://github.com/Nexus-Mods/game-cyberpunk2077)
- Dev chat on the [#vortex-support](https://discord.gg/PxGUQVWk) channel on the Cyberpunk 2077 Modding Community Discord

## Installing

Install from [the page on Nexus](https://www.nexusmods.com/site/mods/196?tab=files).

## Reporting Issues, Feature Requests etc.

If possible, [make reports and requests on Github](https://github.com/Nexus-Mods/game-cyberpunk2077/issues/new/choose).
You can also use [Nexus bugs](https://www.nexusmods.com/site/mods/196?tab=bugs) and
[Nexus posts](https://www.nexusmods.com/site/mods/196?tab=posts).

To help us fix and add things, please:

1. Make sure you've read the usage information on [our page on Nexus](https://www.nexusmods.com/site/mods/196)
2. Make sure you've read any instructions that the mod you're trying to install comes with
3. Try to reproduce the problem so that you can tell us how to reproduce it

There's an [ISSUE_TEMPLATE](./ISSUE_TEMPLATE.md) to help (you can copy it to Nexus too).

---

# Developing

## Setting Up

1. Install [Node.js](https://nodejs.org/en/download/)
2. `corepack enable`

That second step is what gets you pnpm. The version is pinned in `package.json`, so
corepack fetches the right one for you.

**This repo is pnpm only.** `npm install` will produce a dependency tree the build
can't use, and there is no `package-lock.json` to install from.

Then:

```
pnpm install
```

TypeScript, jest, eslint and rolldown all come from the lockfile. Nothing needs
installing globally.

## Everyday Commands

| Command | What it does |
| --- | --- |
| `pnpm run build` | Bundles `src/` into `dist/` with [rolldown](https://rolldown.rs/), then writes `info.json` and copies the images in |
| `pnpm run test` | The [jest](https://jestjs.io/) suite in `test/`. Also runs on pre-commit |
| `pnpm run typecheck` | Type checks without emitting |
| `pnpm run lint` | Lints `src/` and `test/` |

`build` does **not** type check, so run `typecheck` yourself. A bundle can build
cleanly and still be wrong.

CI runs `typecheck` and `test` on every pull request.

## Trying Your Build In Vortex

The quickest loop is to drop the built files straight into Vortex's plugins folder
and restart it:

```
pnpm run build
```

then copy everything in `dist/` over the extension folder:

- Released Vortex: `%APPDATA%\Vortex\plugins\game-cyberpunk2077`
- Vortex running from source: `%APPDATA%\@vortex\main\plugins\game-cyberpunk2077`

Restart Vortex. The extension is reloaded on start, so there's no hot reload; every
change needs a restart.

To sanity check that the build actually loaded, look in Vortex's log
(`%APPDATA%\Vortex\vortex.log`, or `%APPDATA%\@vortex\main\vortex.log` from source)
for these, in order:

```
loaded extension {"name":"game-cyberpunk2077", ...
init extension {"name":"game-cyberpunk2077", ...
[cyberpunk2077] Registering game with Vortex
once {"extension":"game-cyberpunk2077"}
```

`once` only appears once the extension's `main()` has returned, so if it's missing,
initialisation threw. Vortex reports that as a `couldn't initialize extension`
warning with a stack, rather than failing the load outright, and the game can still
appear in the list while everything else the extension registers is silently absent.

## Packaging

The **Package** workflow builds the artifacts. Run it from the Actions tab, pick a
branch, and tick "Also package a release artifact" if you want the release archive
as well as the dev one.

To make an archive locally instead, for handing to someone or for checking it
installs the way a user's would:

| Command | Result |
| --- | --- |
| `pnpm run pack-dev` | Builds, then archives `dist/` as `game-cyberpunk2077-dev-<version>+<commit>-<timestamp>.7z` |
| `pnpm run pack` | Runs the tests, builds, then archives as `game-cyberpunk2077-<version>.7z` |

Both run `script/package.mjs`, which needs **7z** on your PATH.

Install the archive through Vortex > Extensions, dragging it into the drop area at
the bottom, then restart.

## Debugging

Set `DEBUG` to send Vortex `log` calls to the console during a test run:

- posix: `DEBUG=1 pnpm run test`
- PowerShell: `$env:DEBUG=1; pnpm run test; Remove-Item Env:\DEBUG`

For breakpoints, `pnpm run test-debug` starts jest and prints how to attach a
chromium debugger. `pnpm run test-debug -- -t 'part of a test name'` narrows it to
matching tests. There are launch configs in `.vscode/` too: "Debug Jest Tests" runs
jest from VSCode, and `Attach to Node` attaches to anything started with the debug
config. Sourcemaps are generated, so lines line up.

## Live Testing

The [Vortex Extension Test Suite](https://next.nexusmods.com/cyberpunk2077/collections/hl2bnl)
collection on Nexus installs a set of real mods to exercise the installers against
actual releases rather than fixtures.
