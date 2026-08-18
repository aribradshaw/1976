# Asset rights inventory

This inventory covers the non-code media currently shipped with the game. It is not legal advice.

## Verified public-domain portraits

- `public/Jimmy_Carter_1977_cropped.jpg` is the White House portrait listed by Wikimedia Commons as a United States federal government work in the public domain. Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jimmy_Carter_1977_cropped.jpg).
- `public/Gerald_Ford_presidential_portrait_(cropped_2).jpg` is derived from a National Archives image by David Hume Kennerly and is listed by Wikimedia Commons as a United States federal government work in the public domain. Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Gerald_Ford_presidential_portrait_(cropped_2).jpg).

## Open-source typography

- Source Sans 3 and Source Serif 4 are bundled through Fontsource variable-font packages and licensed under the SIL Open Font License 1.1.
- Their package license files remain available under `node_modules/@fontsource-variable/` after installation, and the upstream typeface source is maintained by [Adobe Fonts](https://github.com/adobe-fonts).
- These are the only two typeface families authorized by the interface style guide.

## Audio requiring provenance or replacement

The repository history does not contain enough provenance to confirm redistribution rights for the WAV files under `public/audio/`. Several filenames identify Epic Stock Media products, including files from its commercially distributed interface packs. A purchase or download license may permit use in a game while still restricting redistribution of the source samples.

Until provenance is documented or the sounds are replaced with clearly redistributable alternatives:

- do not copy or redistribute the audio separately;
- do not interpret a future source-code license as applying to `public/audio/`;
- do not add new third-party media without a source URL, author, and license record.

## Project license status

Original source code and documentation are licensed under the [MIT License](../LICENSE). That license does not grant rights to the bundled audio or any other third-party media.

Epic Stock Media's [licensing page](https://epicstockmedia.com/licensing/) says standard licenses prohibit making raw sound effects available to third parties and may require a Custom Application License when users control playback in a web app. The [Epic Stock Media EULA](https://epicstockmedia.com/wp-content/uploads/2018/01/ESM-EULA.pdf) also prohibits redistribution of the content as a standalone product or embedded in a sound-effects library. Until purchase records and the applicable application license are verified, the audio must remain separately identified and must not be represented as MIT-licensed. A future audio replacement pass can remove this boundary.

### Files to confirm before the itch.io page becomes public

The private itch.io draft may be assembled for review, but public release should wait until the following nine files are confirmed. For each file, record whether Ari created the recording, commissioned it with game-distribution rights, or downloaded it under a license that covers an HTML5 browser game.

| File | Current evidence | Confirmation needed |
| --- | --- | --- |
| `public/audio/tvstatic.wav` | No external vendor is identified in the filename or repository history. | Confirm it is an original Ari Bradshaw recording or provide its source and license. |
| `public/audio/stateselect.wav` | No external vendor is identified in the filename or repository history. | Confirm it is an original Ari Bradshaw recording or provide its source and license. |
| `public/audio/deselectstate.wav` | No external vendor is identified in the filename or repository history. | Confirm it is an original Ari Bradshaw recording or provide its source and license. |
| `public/audio/ESM_Game_Notification_82_Coin_Blip_Select_Tap_Button.wav` | Filename indicates Epic Stock Media. | Locate the purchase/download record and confirm the applicable web-game or application license. |
| `public/audio/ESM_Game_Notification_83_Coin_Blip_Select_Tap_Button.wav` | Filename indicates Epic Stock Media. | Locate the purchase/download record and confirm the applicable web-game or application license. |
| `public/audio/clicks/ESM_GW_foley_one_shot_gun_handling_trigger_22_rifle_click_squeeze_pull_5.wav` | Filename indicates Epic Stock Media. | Locate the purchase/download record and confirm the applicable web-game or application license. |
| `public/audio/clicks/ESM_Builder_Game_Switch_3_Click_Button_Tab_Select_Particle_Chirp.wav` | Filename indicates Epic Stock Media. | Locate the purchase/download record and confirm the applicable web-game or application license. |
| `public/audio/clicks/ESM_BG_Cinematic_FX_ui_button_one_shot_digital_mouse_double_click_02.wav` | Filename indicates Epic Stock Media. | Locate the purchase/download record and confirm the applicable web-game or application license. |
| `public/audio/clicks/ESM_Perfect_Clean_App_Button_Click_2_Organic_Simple_Classic_Game_Click.wav` | Filename indicates Epic Stock Media. | Locate the purchase/download record and confirm the applicable web-game or application license. |

If the first three are original recordings, a short written confirmation from Ari is enough for the project record. The six Epic Stock Media files need the receipt or account-library evidence plus the license terms that applied when they were obtained. If that evidence cannot be found, replace those six sounds before publication.
