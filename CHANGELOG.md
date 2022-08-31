# Cyberpunk2077 Vortex Support v0.8.0 "TAKEMURA"

Beware mean reds. Gotta keep moving, gotta stay crystal, never lose focus - 'specially when you think you're gold. You might've put together the sharpest crew since the 20's, but you only gotta be unlucky once. Make exit, don't stand still, gear up, chrome up, change your face if you gotta. They're gonna come for you and the only way out is up.

Update directly in Vortex, or get the release on the Nexus page (or Github): https://www.nexusmods.com/site/mods/196?tab=files

Why use a mod manager? In addition to quality-of-life improvements like automatically fixing many common types of mod structure problems that you'd have to do by hand, clear (?) instructions on any possile additional steps for any given mod or problem encountered, and the easy ability to enable/disable mods, you also get profiles to manage separate sets of mods more easily, update notifications, much easier game upgrades, easy toggling between multiple versions or variants (e.g. colors) of a mod, Collections, and all sorts of nice things. And you can of course install mods from any source - even the mod showcase channel, and they do not even need to be in a zipfile. We gotchu.

As always, any feedback and such is appreciated so we can ensure that no bugs or oversights have slipped through our testing - and other feedback and ideas are more than welcome! Please get in touch either on Discord, Github, or Nexus (links at the bottom).

## Main Jobs

No time to advance the story this sesh, just doing side gigs!

## Fixer Gigs

- ✨️ Support new RED4ext 1.7 [\#191 by @E1337Kat](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/191)
- 🐛 Separate Fem/Masc Preset Support For Appearance Change Unlocker Presets [\#183 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/183)
- 🐛 MultiType Redscript Installs Basedir Layout Correctly [\#185 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/185)

## Cyberdeck Upgrades aka Internal Stuff(tm)

- 🎨 Replace Prettier with Eslint Rules [\#189 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/189)
- 📝 Explicitly State That The ASCII Art Structure Is Incomplete [\#179 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/179)


**Full Changelog**: [v0.7.0...v0.8.0](https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/v0.7.0...v0.8.0)

## Detes

The fixes should just make your life easier, no need to do anything special! In addition to the fixes, there's some support built in for CyberScript in this release, but full support will come in the next release. And then some other goodies...

## The Crew

No new contributors this time around, but we got good bug reports, thank you - and thanks for all your help, ideas, and support!

## Holo at us

[Discord](<https://discord.gg/7NUQJ2b4ZN>) (\#cyberpunk2077-vortex-support on the CP2077 Modding Community server)
[Github](https://github.com/E1337Kat/cyberpunk2077_ext_redux)
[Nexus](https://www.nexusmods.com/site/mods/196)

End of transmission, subject: 'v0.8.0 "TAKEMURA"'

---

# Cyberpunk2077 Vortex Support v0.7.0 "Meredith"

_Don't get too attached, you're just a tool to get the job done... even if part of it seems to merge biz with something a bit more personal,
and a whole different look. Input? Output? Not up to you. But that's corpo life for you. Play your cards right, and maybe you're just left
wondering why your holo goes unanswered next morning instead of finding yourself in concrete overshoes having outlived your usefulness._

Update directly in Vortex, or get the release on the Nexus page (or Github): https://www.nexusmods.com/site/mods/196?tab=files

Why use a mod manager? In addition to quality-of-life improvements like automatically fixing many common types of mod structure
problems that you'd have to do by hand, clear (?) instructions on any possile additional steps for any given mod or problem
encountered, and the easy ability to enable/disable mods, you also get profiles to manage separate sets of mods more easily,
update notifications, much easier game upgrades, easy toggling between multiple versions or variants (e.g. colors) of a mod,
Collections, and all sorts of nice things. And you can of course install mods from any source - even the mod showcase channel, and
they do not even need to be in a zipfile. We gotchu.

As always, any feedback and such is appreciated so we can ensure that no bugs or oversights have slipped through our testing - and
other feedback and ideas are more than welcome! Please get in touch either on Discord, Github, or Nexus (links at the bottom).

## Main Jobs

- ✨ Initial support for CyberCAT GUI as a Tool! See below for the detes. [\#164 by @Bladehawke](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/164)
- ✨ Input Loader's XML mods (in `r6/input/`) are now supported! [\#167 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/167)
  - ✨ Input Loader itself is treated as a Core enabling mod, and also uninstalls cleanly! [\#174 by @Bladehawke](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/174)
- ✨ Character preset support for _both_ CyberCAT _and_ Appearance Change Unlocker presets - and we figure out which kind it is! [\#169 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/169)

## Fixer Gigs

- ⚰️ CSVMerge and its dependency on Wolvenkit CLI deprecated. [\#171 @Bladehawke](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/171)
- 🐛 A few reports around Input Loader support got fixed!

## Cyberdeck Upgrades aka Internal Stuff(tm)

- ✨ The CyberCAT support led to building Tool installation functionality, and we'll refine it some more. [\#173 by @Bladehawke](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/173)
- 🧪 Automated tests for all the new stuff as always
- ♻️ No major refactors, but the usual fixing and extracting as part of feature work
- λ ...And Auska snuck in some more functional stuff from fp-ts mwahahaha

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/v0.6.0...v0.7.0

## Detes

CyberCAT can now be installed via Vortex. You can use it in the usual manner after installation, but we've also wrapped it up as a Tool
that you can use from Vortex directly! The Tool is just a bit finicky on the first run - just make sure that you have _enabled_ the mod,
and that you have _restarted_ Vortex _after_ that. Then you should see a nice shiny button for CyberCAT right on your dashboard. If the
button is grayed out, make sure you have the mod enabled, restart Vortex again, and it should work.

As usual, CyberCAT can load any save file and you can load presets from anywhere, but if you install one via Vortex, it'll be placed
in the `V2077/presets/cybercat/` directory. The Unlocker presets get placed in the same directory that Unlocker itself uses, and should
be picked up automatically.

## The Crew

No new Netrunners for this release, but @Bladehawke and @E1337Kat are back, and coordination with
mod authors was great as always - thanks for all your help, ideas, and support!

## Holo at us

Discord: https://discord.gg/7NUQJ2b4ZN (\#cyberpunk2077-vortex-support on the CP2077 Modding Community server)
Github: https://github.com/E1337Kat/cyberpunk2077_ext_redux
Nexus: https://www.nexusmods.com/site/mods/196

End of transmission, subject: 'Cyberpunk Vortex Support v0.7.0 "Meredith"'

---

# Cyberpunk2077 Vortex Support 0.6.0 "Evelyn"

_It's all about appearances. Press of a button, a touch of a brush, a new identity, new location, new outfit, new decor. Fit in
anywhere. Don't just survive, *belong*. And keep your eyes open for those shards and datapads. People are so trusting, especially
when they're.. distracted. Appearances get you the information. Forget the iron, information is what makes legends. I wouldn't come
to just anyone with this, but you were highly recommended, and I can see why..._

Update directly in Vortex, or get the release on the Nexus page (or Github for that matter): https://www.nexusmods.com/site/mods/196?tab=files

Why use a mod manager? In addition to quality-of-life improvements like automatically fixing many common types of mod structure
problems that you'd have to do by, clear (?) instructions on any possile additional steps for any given mod or problem
encountered, and the easy ability to enable/disable mods, you also get profiles to manage separate sets of mods more easily,
update notifications, much easier game upgrades, easy toggling between multiple versions or variants (e.g. colors) of a mod. And
you can of course install mods from any source - even the mod showcase channel!

As always, any feedback and such is appreciated so we can ensure that no bugs or oversights have slipped through our testing - and
other feedback and ideas are more than welcome! Please get in touch either on Discord, Github, or Nexus (links at the bottom).

## Main Jobs

- ✨ Appearance Menu Mod, AMM to chooms, gets dedicated support! There's a ton of AMM mods and we want to make sure that we can support them
  beyond what just generic CET support provides where needed. [\#149 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/149)
- ✨ ...And one of the first things is that we can tell AMM mods apart - you can for example drop a plain location file into Vortex and we'll
  put it in the right place for you! Or any other Collab or User mod, or several kinds at once! [\#156 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/156)
- ✨ Extra text and image files will no longer confuse the poor extension - they're probably documentation or other relevant detes, so we'll make sure
  to install them with the mod. To avoid littering everywhere, we put them all in a special directory in your game dir so that they're
  conveniently accessible in one place. [\#148 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/148)

## Fixer Gigs

- 🐛 Redscript won't complain even if it has to go two or more subdirectories down to find the first `.reds` file, which should help
  ensure modders can create layouts that make sense for their redscript mod - thanks for the bug report and being all nice about it :) [\#159 by Auska](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/159)

## Cyberdeck Upgrades aka Internal Stuff(tm)

- GH build improvements [\#154 by @E1337Kat](https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/154)
- Tests check that dialogs and notifications are shown where expected
- Bunch of big and small refactors and QoL stuff for development

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/v0.5.0...v0.6.0

No new Netrunners for this release, but lots of helpful feedback, thank you!

## Holo at us

Discord: https://discord.gg/7NUQJ2b4ZN (\#cyberpunk2077-vortex-support on the CP2077 Modding Community server)
Github: https://github.com/E1337Kat/cyberpunk2077_ext_redux
Nexus: https://www.nexusmods.com/site/mods/196

---

# CP2077 Vortex Support 0.5.0 "T-Bug" Is Here!

You can update it directly in Vortex, or get the release on the Nexus page (or Github for that matter):
https://www.nexusmods.com/site/mods/196?tab=files

No time for chit-chat, laser-sharp focus on _\*checks shard\*_ config mod support. That’s right, just pop this in and Vortex will
pick up the skills to handle JSON and XML in a few milliseconds! We’re also putting some ICE around your most valuable assets and
protect some files from _accidental_ overwrites.

Why use a mod manager? In addition to quality-of-life improvements like automatically fixing many common types of mod structure
problems that you'd have to do by, clear (?) instructions on any possile additional steps for any given mod or problem
encountered, and the easy ability to enable/disable mods, you also get profiles to manage separate sets of mods more easily,
update notifications, much easier game upgrades, easy toggling between multiple versions or variants (e.g. colors) of a mod. And
you can of course install mods from any source - even the mod showcase channel!

As always, any feedback and such is appreciated so we can ensure that no bugs or oversights have slipped through our testing - and
other feedback and ideas are more than welcome! Please get in touch either on Discord, Github, or Nexus (links at the bottom).

## Main Jobs

- ✨ Config XML support by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/134
- ✨ Config JSON support in MultiType by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/137

- These two come with the concept and feature of "protected paths": you may for example already have changes in your input mapping
  file, so we’ll warn you about it so that you can back it up and/or merge the two (…actual merge functionality not included in
  this release).

## Fixer Gigs

- 🐛 Fixed MultiType installation bug that affected \(Vehicle Combat\) [\#118](https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/118)
- ✨ JSON Should Prompt, Maybe — and now it does, instead of blocking the install [\#113](https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/113)

## Cyberdeck Upgrades aka Internal Stuff(tm)

- ♻️ Start Splitting Tests by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/136
- ♻️ Improved prompting

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/v0.4.1...v0.5.0-gonk

## Holo at us

Discord: https://discord.gg/ 7NUQJ2b4ZN (\#cyberpunk2077-vortex-support on the CP2077 Modding Community server)
Github: https://github.com/E1337Kat/cyberpunk2077_ext_redux
Nexus: https://www.nexusmods.com/site/mods/196

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

- Giftwrapping! Got a fresh mod but the mod author packaged it in a single folder and zipped that up? hey it happens, and we want to support you in your unwrapping efforts! Have a merry ~~xmas~~ ~~ramadan~~ ~~birthday~~ uhh.... Celebratory Mod Day?
- TweakXL and ArchiveXL support!
- Some improvements (?) to info and prompt texts, and generally always trying to prompt to let you choose if you want to proceed rather than stop the installation

## Gigs

- A couple Redscript edge cases affecting e.g. StreetStyle and LHUD patches fixed - these won't refuse to install anymore.

## Cyberdeck Upgrades aka Internal Stuff(tm)

- Internalized Pipeline! this ensures we have full control over installation, and makes future changes easier :slight_smile:
- Full Changelog: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/v0.3.0...v0.4.1

## Holo at us

Discord: https://discord.gg/ 7NUQJ2b4ZN (#cyberpunk2077-vortex-support on the CP2077 Modding Community server)
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

- TweakXL and ArchiveXL give false negatives on install, but most mods using them will be packaged correctly and can be installed fine via the "fallback" installer
- when the fallback installer is hit, the file list includes folders. this is quirk in how files are passed around in vortex, but not really a problem... this quirk is also what made 0.2.1 so bad, but that's long ago.

## Here's some PRs

- Basic Tests & Runner by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/21
- Script For Creating Local Packages by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/34
- CET Mod Installation Fixes by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/35
- Drop Fallback Support For Supported Types by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/38
- Add Notification Mechanism To Test/Install Functions (Plus Other Vortex API Access) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/42
- Redscript Support (And Lots Of Test Refactors) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/45
- Json file support by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/46
- ✨ Add support for mixed up CET and red mods by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/47
- Vortex Extracted Into Separate File + Additional CET/Reds Mixed Test by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/48
- Add github action for test by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/49
- Update README a bit, add issue template by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/59
- Separate support failures from install failures by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/61
- Support for CoreCET, CoreRedscript and CORERed4ext by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/63
- Reshade and INI handling by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/52
- ArchiveOnly Retains Subdirs + FileTree Abstraction by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/51
- ⬆ Typescript 4.6 and ALL THE DEPS by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/65
- JSON installer rejects unknown JSON files by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/67
- 👷 Update CI by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/69
- Support CSVMerge and WolvenKit.CLI by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/68
- 📝 Add issue templates by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/70
- 👥 Add Bladehawke as contributor by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/71
- Re-enable the INI handlers by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/72
- Hotfix/fallback fixes by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/77
- Add Link to Test Suite Collection by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/80
- Red4Ext Support by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/57
- MultiType Installer For CET/Reds/Red4Ext/Archive Mixes by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/83
- 🔨 npm run clean (_.7z, dist/_) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/85
- Adds ASI mods to the current functionality by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/93
- Allow AMM mods with JSON to hit the fallback by @Bladehawke in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/100
- Use A Namespaced Synthetic Modname by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/86
- MultiType Supports Basedir Red4Exts by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/87
- Revert "MultiType Supports Basedir Red4Exts" by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/104
- Revert "Use A Namespaced Synthetic Modname" by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/105
- 🐛 ✏️ Merge conflict resolution by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/107

## New Contributors

- @Bladehawke made their first contribution in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/46

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/compare/0.2.2...v0.3.0

# CP2077 Vortex Support 0.2.1

## What's Changed

- Enforce Eslint And Prettier On Pre-Commit by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/18
- 🐛 Allow the archive installer to install readmes with it. by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/19

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/commits/0.2.1

# CP2077 Vortex Support 0.2.0

## What's Changed

- Add README with basic install instructions by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/7
- Add INI mod support (#2) by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/11
- Dev branch with various commits and merges by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/15
- Fix some CET mod files getting left out by @effs in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/14
- ✨ Add separate installer for mods which contain only archives for #9 by @E1337Kat in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/16

## New Contributors

- @effs made their first contribution in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/7
- @E1337Kat made their first contribution in https://github.com/E1337Kat/cyberpunk2077_ext_redux/pull/15

**Full Changelog**: https://github.com/E1337Kat/cyberpunk2077_ext_redux/commits/0.2.0
