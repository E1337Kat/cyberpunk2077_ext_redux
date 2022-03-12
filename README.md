# Cyberpunk 2077 Support for Vortex Mod Manager

- [Cyberpunk 2077 Vortex Support on Nexus](https://www.nexusmods.com/site/mods/196)
- [Repository on Github](https://github.com/E1337Kat/cyberpunk2077_ext_redux)
- Dev chat on the #nexus-vortex-update-for-cyberpunk2077 channel on [Cyberpunk 2077 Modding Community Discord](https://discord.gg/PxGUQVWk)

## Installation

Install from [the page on Nexus](https://www.nexusmods.com/site/mods/196?tab=files)

## Manual Installation (e.g. for a development version)

Prerequisite: You need either a packaged release from [Nexus](https://www.nexusmods.com/site/mods/196?tab=files) or [Github](https://github.com/E1337Kat/cyberpunk2077_ext_redux/releases), or you can build manually (see developer info below)

Then, in Vortex:

1. Go to the 'Extensions' tab
2. Find the Cyberpunk 2077 extension in the list
3. Click on the 'Remove' button on the right side to uninstall it completely. (The button could be covered up by an info pane that pops out of the 4. right hand side. You can make that go away by double clicking on any entry in the list). _This will NOT remove your game, mods, or profiles_.
4. Vortex will want to be restarted, so go ahead and do that.
5. Now you will see that Cyberpunk does not show up as a game at all (but it's still there, don't worry)
6. Go back to the 'Extensions' tab
7. At the bottom either click where it says "Drop Files" and select the zipped release (or 7z, rar, whatever the package format is), or you can indeed drag-n-drop the zip from Explorer to that field.
8. Vortex should prompt you to restart. If it doesn't, just close Vortex and restart it manually.
9. On relaunch, select cyberpunk, and you will be ready to go.

## Reporting Issues, Feature Requests etc.

If possible, [make reports and requests on Github](https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/new/choose). You can also use [Nexus bugs](https://www.nexusmods.com/site/mods/196?tab=bugs) and [Nexus posts](https://www.nexusmods.com/site/mods/196?tab=posts).

To help us fix and add things, please:

1. Make sure you've read the usage information on the [our page on Nexus](https://www.nexusmods.com/site/mods/196)
2. Make sure you've read any instructions that the mod you're trying to install comes with
3. Try to reproduce the problem so that you can tell us how to reproduce it.

You can use the [ISSUE_TEMPLATE](./ISSUE_TEMPLATE.md) to help us (you can copy it to Nexus too)

## Developer Info

### Prerequisites

1. Check you can use the terminal either in your IDE, or PowerShell directly (cmd.exe is not ideal)
2. Install [nodejs 16](https://nodejs.org/en/download/)
   - Alternatively install using [a package manager](https://nodejs.org/en/download/package-manager/#windows)
   - To check nodejs works and your path etc. are correct: `node --version`
3. Install [TypeScript](https://www.typescriptlang.org/download/)
   - `npm install -g typescript`
   - To check TS works: `tsc --version`
4. Install [Vortex Mod Manager](https://www.nexusmods.com/about/vortex/)

### Build & Install

1. `npm install`
2. `npm run build`
   - If you're on nodejs 17+ and get an OpenSSL error, use `export NODE_OPTIONS=--openssl-legacy-provider`
3. Create a zip/rar/7z archive containing everything in .\dist\
4. Open Vortex > Extensions
   1. Disable the `Cyberpunk 2077 Support` extension if enabled
   2. Drag & Drop or click to add the zipfile from step 3 to install/update the new extension
5. Restart Vortex
6. Try to install a mod to verify the extension works correctly

### Running The Tests

There's a [jest](https://jestjs.io/) test suite in `test/`, and it's automatically run on
pre-commit. You can also use `npm run test` and/or configure that in your IDE.

## Reporting Bugs & Making Suggestions

https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues
