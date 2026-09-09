// Vortex injects this module at runtime and it ships no types of its own, so
// we declare the two functions we call.
declare module "exe-version" {
  export function getFileVersion(exePath: string): Promise<string>;
  export function getProductVersion(exePath: string): Promise<string>;
}
