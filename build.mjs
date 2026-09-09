import { readFileSync, globSync } from "node:fs";
import { builtinModules } from "node:module";
import { basename, resolve } from "node:path";

import { rolldown } from "rolldown";

/**
 * Modules Vortex injects at runtime, which must stay as bare requires rather
 * than being bundled. Bundling any of these ships a second copy of a singleton
 * (React especially) and breaks at runtime.
 *
 * `externals.json` lists the packages this extension declares that Vortex also
 * provides. Regenerate it when adding a dependency that Vortex already ships:
 * anything present in both this package.json and Vortex's `src/main/package.json`
 * belongs in the list. Everything else, `fp-ts` and friends, is ours to bundle.
 */
function getExternals() {
  const provided = JSON.parse(readFileSync(resolve(import.meta.dirname, "externals.json"), "utf8"));

  const ids = [
    ...new Set([
      ...builtinModules.filter((m) => !m.startsWith("_")),
      ...provided,
      "electron",
      "@nexusmods/vortex-api",
    ]),
  ];

  // Match the package itself and any subpath, so `react/jsx-runtime` stays external too.
  return ids.map((id) => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|/)`));
}

/**
 * `@vortex-api-test-shimmed` is the seam the tests swap out for a mock. In a
 * real build it is `@nexusmods/vortex-api`, which Vortex injects at runtime,
 * so the bundle must ask for it under that exact name.
 */
function vortexApiShimPlugin() {
  return {
    name: "vortex-api-shim",
    resolveId(id) {
      if (id === "@vortex-api-test-shimmed") {
        return { id: "@nexusmods/vortex-api", external: true };
      }
    },
  };
}

/** Copies the images and licence Vortex expects alongside the bundle. */
function copyAssetsPlugin() {
  return {
    name: "copy-assets",
    generateBundle() {
      for (const file of globSync(["*.png", "*.jpg", "LICENSE"])) {
        this.emitFile({ type: "asset", fileName: basename(file), source: readFileSync(file) });
      }
    },
  };
}

const bundle = await rolldown({
  input: resolve(import.meta.dirname, "src", "index.ts"),
  platform: "node",
  external: getExternals(),
  resolve: { tsconfigFilename: resolve(import.meta.dirname, "tsconfig.json") },
  plugins: [vortexApiShimPlugin(), copyAssetsPlugin()],
});

await bundle.write({
  file: resolve(import.meta.dirname, "dist", "index.js"),
  format: "cjs",
  sourcemap: true,
  exports: "auto",
});

await bundle.close();
