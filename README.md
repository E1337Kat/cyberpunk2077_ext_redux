## Prerequisites

1. Check you can use the terminal either in your IDE, or PowerShell directly (cmd.exe is not ideal)
2. Install [nodejs 16](https://nodejs.org/en/download/)
   - Alternatively install using [a package manager](https://nodejs.org/en/download/package-manager/#windows)
   - To check nodejs works and your path etc. are correct: `node --version`
3. Install [TypeScript](https://www.typescriptlang.org/download/)
   - `npm install -g typescript`
   - To check TS works: `tsc --version`
4. Install [Vortex Mod Manager](https://www.nexusmods.com/about/vortex/)

## Build & Install

1. `npm install`
2. `npm run build`
   - If you're on nodejs 17+ and get an OpenSSL error, use `export NODE_OPTIONS=--openssl-legacy-provider`
3. Create a zip/rar/7z archive containing everything in .\dist\
4. Open Vortex > Extensions
   1. Disable the `Cyberpunk 2077 Support` extension if enabled
   2. Drag & Drop or click to add the zipfile from step 3 to install/update the new extension
5. Restart Vortex
6. Try to install a mod to verify the extension works correctly

## Running The Tests

There's a [jest](https://jestjs.io/) test suite in `test/`, and it's automatically run on
pre-commit. You can also use `npm run test` and/or configure that in your IDE.

## Reporting Bugs & Making Suggestions

https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues
