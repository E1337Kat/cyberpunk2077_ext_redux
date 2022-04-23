# CP2077 Vortex Support 0.4.1 or _The Sandra Release_ is here!

You can update it directly in Vortex, or get the release on the Nexus page (or Github for that matter):
https://www.nexusmods.com/site/mods/196?tab=files

We wanted to get the XL supports in there sooner than later, but know we did not want to compromise on quality of the release. In
common with Sandra Dorsett, this release makes use of some mad programming skills all hidden behind an innocent facade. Hopefully
the release does not take on the trait of being on ice though!

Why use a mod manager? Glad you asked! We appreciate it's been rocky with the original developer unable to continue, but that's
why we're doing it now. There's still work to get to what we consider baseline functionality (and then we get to the fun stuff!)
but you can already install pretty much any mod and get helpful info about any additional steps to take and any problems we
notice. You can install mods from any source (yes, even showcase channels!), not just Nexus. The manager makes it a lot easier to
handle e.g. game upgrades, switching between different characters or other different setups through Profiles, and tells you about
updates for Nexus mods, lets you have multiple versions of any given mod and enable/disable stuff with a click, and lots besides.

As always, any feedback and such is appreciated so we can ensure that no bugs or oversights have slipped through our testing - and
other feedback and ideas are more than welcome! Please get in touch either on Discord, Github, or Nexus (links at the bottom).

## Main Jobs
* Giftwrapping! Got a fresh mod but the mod author packaged it in a single folder and zipped that up? hey it happens, and we want to support you in your unwrapping efforts! Have a merry ~~xmas~~ ~~ramadan~~ ~~birthday~~ uhh.... Celebratory Mod Day?
* TweakXL and ArchiveXL support!
* Some improvements (?) to info and prompt texts, and generally always trying to prompt to let you choose if you want to proceed rather than stop the installation

## Gigs
* A couple Redscript edge cases affecting e.g. StreetStyle and LHUD patches fixed - these won't refuse to install anymore.

## Cyberdeck Upgrades aka Internal Stuff(tm)
* Internalized Pipeline! this ensures we have full control over installation, and makes future changes easier :slight_smile: 
* Full Changelog: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/v0.3.0...v0.4.1

## Holo at us
Discord: https://discord.gg/  7NUQJ2b4ZN  (#cyberpunk2077-vortex-support on the CP2077 Modding Community server)
Github: https://github.com/E1337Kat/cyberpunk2077_ext_redux
Nexus: https://www.nexusmods.com/site/mods/196




# CP2077 Vortex Support 0.3.0 or _The Jackie Release_

This marks our first major release since picking this project up. This is a rather thick release full of support and changes that
will at the very least make a lot of mods easier to install. We are calling this the Jackie release because it is big and amazing
and full of goodness. Sure it isn't perfect. You will find there there are issues with TweakXL and ArchiveXL mods saying they
couldn't be installed as desired... but that's because they didn't exist when we decided on this milestone. Hope y'all enjoy your
time modding Night City!

Bug reports here or on Discord appreciated!

## What's Changed

- Generally a bunch more usable
- Most mod types and file layouts now supported (CET, Redscript, Red4Ext, INI, Reshade, JSON config, Archives...)
- Anything not directly supported (yet) can be installed (but we'll prompt you for it)
- Helpful (?) error and info messages
- Lots of under the hood changes

## Known Issues
* TweakXL and ArchiveXL give false negatives on install, but most mods using them will be packaged correctly and can be installed fine via the "fallback" installer
* when the fallback installer is hit, the file list includes folders. this is quirk in how files are passed around in vortex, but not really a problem... this quirk is also what made 0.2.1 so bad, but that's long ago.

## Here's some PRs
* Basic Tests & Runner by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/21
* Script For Creating Local Packages by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/34
* CET Mod Installation Fixes by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/35
* Drop Fallback Support For Supported Types by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/38
* Add Notification Mechanism To Test/Install Functions (Plus Other Vortex API Access) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/42
* Redscript Support (And Lots Of Test Refactors) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/45
* Json file support by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/46
* ✨ Add support for mixed up CET and red mods by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/47
* Vortex Extracted Into Separate File + Additional CET/Reds Mixed Test by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/48
* Add github action for test by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/49
* Update README a bit, add issue template by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/59
* Separate support failures from install failures by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/61
* Support for CoreCET, CoreRedscript and CORERed4ext by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/63
* Reshade and INI handling by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/52
* ArchiveOnly Retains Subdirs + FileTree Abstraction by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/51
* ⬆ Typescript 4.6 and ALL THE DEPS by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/65
* JSON installer rejects unknown JSON files by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/67
* 👷 Update CI by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/69
* Support CSVMerge and WolvenKit.CLI by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/68
* 📝 Add issue templates by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/70
* 👥 Add Bladehawke as contributor by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/71
* Re-enable the INI handlers by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/72
* Hotfix/fallback fixes by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/77
* Add Link to Test Suite Collection by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/80
* Red4Ext Support by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/57
* MultiType Installer For CET/Reds/Red4Ext/Archive Mixes by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/83
* 🔨 npm run clean  (*.7z, dist/*) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/85
* Adds ASI mods to the current functionality by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/93
* Allow AMM mods with JSON to hit the fallback by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/100
* Use A Namespaced Synthetic Modname by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/86
* MultiType Supports Basedir Red4Exts by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/87
* Revert "MultiType Supports Basedir Red4Exts" by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/104
* Revert "Use A Namespaced Synthetic Modname" by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/105
* 🐛 ✏️ Merge conflict resolution by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/107

## New Contributors
* @Bladehawke made their first contribution in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/46

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/0.2.2...v0.3.0



# CP2077 Vortex Support 0.2.1

## What's Changed
* Enforce Eslint And Prettier On Pre-Commit by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/18
* 🐛 Allow the archive installer to install readmes with it. by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/19


**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/commits/0.2.1



# CP2077 Vortex Support 0.2.0

## What's Changed
* Add README with basic install instructions by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/7
* Add INI mod support (#2) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/11
* Dev branch with various commits and merges by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/15
* Fix some CET mod files getting left out by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/14
* ✨ Add separate installer for mods which contain only archives for #9 by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/16

## New Contributors
* @effs made their first contribution in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/7
* @E1337Kat made their first contribution in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/15

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/commits/0.2.0