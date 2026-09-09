import path from "path";
import {
  map,
} from "fp-ts/lib/ReadonlyArray";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  CONFIG_INI_MOD_BASEDIR,
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  CYBERPUNK_CACHE_PATH,
} from "../../src/installers.layouts";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  copiedToSamePath,
  createdDirectory,
  mergeOrFailOnConflict,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  ExampleSucceedingMod,
  pathHierarchyFor,
  RED4EXT_PREFIX,
} from "./utils.helper";

const inputLoaderInFiles = {
  v012: [
    path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\inputUserMappings.xml`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\license.md`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\readme.md`),
    path.join(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.ini`),
    path.join(`${CYBERPUNK_CACHE_PATH}\\inputContexts.xml`),
    path.join(`${CYBERPUNK_CACHE_PATH}\\inputUserMappings.xml`),
  ],
  v011: [
    path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\inputUserMappings.xml`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\license.md`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\readme.md`),
    path.join(`${RED4EXT_PREFIX}\\input_loader_uninstall.bat`),
  ],
  v010: [
    path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\inputUserMappings.xml`),
  ],
};


// Input Loader has shipped several different file sets. Each installs as-is,
// alongside the directory input mods drop their mappings into.
const CoreInputLoaderInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  pipe(
    Object.entries(inputLoaderInFiles),
    map(([version, files]) => [
      `Core Input Loader ${version} installs whatever that release ships`,
      {
        expectedInstallerType: InstallerType.CoreInputLoader,
        inFiles: [
          ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
          ...pathHierarchyFor(`${CONFIG_INI_MOD_BASEDIR}\\`),
          ...pathHierarchyFor(`${CYBERPUNK_CACHE_PATH}\\`),
          ...files,
        ],
        outInstructions: [
          createdDirectory(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}`), // This is a special case
          ...pipe(
            files,
            map(copiedToSamePath),
          ),
        ],
      },
    ]),
  ),
);


const CoreInputLoaderInstallsAlongsideExtraFiles = new Map<string, ExampleSucceedingMod>([
  [
    `Core Input Loader installs when the archive carries extra files`,
    {
      expectedInstallerType: InstallerType.CoreInputLoader,
      inFiles: [
        ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
        ...pathHierarchyFor(`${CONFIG_INI_MOD_BASEDIR}\\`),
        ...pathHierarchyFor(`${CYBERPUNK_CACHE_PATH}\\`),
        ...inputLoaderInFiles.v012,
        path.join(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.txt`),
      ],
      outInstructions: [
        createdDirectory(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}`), // This is a special case
        ...pipe(
          inputLoaderInFiles.v012,
          map(copiedToSamePath),
        ),
        copiedToSamePath(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.txt`),
      ],
    },
  ],
]);


const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    CoreInputLoaderInstallSucceeds,
    CoreInputLoaderInstallsAlongsideExtraFiles,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;
