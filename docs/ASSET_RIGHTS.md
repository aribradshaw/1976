# Asset rights inventory

This inventory covers the non-code media currently shipped with the game. It is not legal advice.

## Verified public-domain portraits

- `public/Jimmy_Carter_1977_cropped.jpg` is the White House portrait listed by Wikimedia Commons as a United States federal government work in the public domain. Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jimmy_Carter_1977_cropped.jpg).
- `public/Gerald_Ford_presidential_portrait_(cropped_2).jpg` is derived from a National Archives image by David Hume Kennerly and is listed by Wikimedia Commons as a United States federal government work in the public domain. Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Gerald_Ford_presidential_portrait_(cropped_2).jpg).

## Open-source typography

- Source Sans 3 and Source Serif 4 are bundled through Fontsource variable-font packages and licensed under the SIL Open Font License 1.1.
- Their package license files remain available under `node_modules/@fontsource-variable/` after installation, and the upstream typeface source is maintained by [Adobe Fonts](https://github.com/adobe-fonts).
- These are the only two typeface families authorized by the interface style guide.

## Audio provenance

Ari Bradshaw confirmed on August 18, 2026 that `tvstatic.wav`, `stateselect.wav`, and `deselectstate.wav` are his original recordings. He also confirmed that the six Epic Stock Media files listed below were downloaded through his paid Splice account.

[Splice's current terms](https://splice.com/terms) grant a perpetual right to use downloaded Sounds in commercial and noncommercial Creative Works, explicitly including video games. The license permits sound effects to be used in isolation inside the game, while prohibiting redistribution as standalone sounds or sample-library content.

Release handling requirements:

- do not copy or redistribute the audio separately;
- do not interpret a future source-code license as applying to `public/audio/`;
- do not add new third-party media without a source URL, author, and license record.

## Project license status

Original source code and documentation are licensed under the [MIT License](../LICENSE). That license does not grant rights to the bundled audio or any other third-party media.

The Epic Stock Media files were obtained through Splice rather than directly from Epic Stock Media, so their use in this game is governed by the Splice license attached to those downloads. They remain separately identified and are not covered by the repository's MIT License.

### Confirmed files

The following nine files are cleared for incorporation into the HTML5 game build. A Splice Certified License should still be generated and retained privately as convenient evidence for the six Splice downloads.

| File | Current evidence | Clearance |
| --- | --- | --- |
| `public/audio/tvstatic.wav` | Original Ari Bradshaw recording. | Confirmed by Ari Bradshaw on August 18, 2026. |
| `public/audio/stateselect.wav` | Original Ari Bradshaw recording. | Confirmed by Ari Bradshaw on August 18, 2026. |
| `public/audio/deselectstate.wav` | Original Ari Bradshaw recording. | Confirmed by Ari Bradshaw on August 18, 2026. |
| `public/audio/ESM_Game_Notification_82_Coin_Blip_Select_Tap_Button.wav` | Downloaded through Ari Bradshaw's paid Splice account. | Covered as a Splice Sound incorporated into a video game Creative Work. |
| `public/audio/ESM_Game_Notification_83_Coin_Blip_Select_Tap_Button.wav` | Downloaded through Ari Bradshaw's paid Splice account. | Covered as a Splice Sound incorporated into a video game Creative Work. |
| `public/audio/clicks/ESM_GW_foley_one_shot_gun_handling_trigger_22_rifle_click_squeeze_pull_5.wav` | Downloaded through Ari Bradshaw's paid Splice account. | Covered as a Splice Sound incorporated into a video game Creative Work. |
| `public/audio/clicks/ESM_Builder_Game_Switch_3_Click_Button_Tab_Select_Particle_Chirp.wav` | Downloaded through Ari Bradshaw's paid Splice account. | Covered as a Splice Sound incorporated into a video game Creative Work. |
| `public/audio/clicks/ESM_BG_Cinematic_FX_ui_button_one_shot_digital_mouse_double_click_02.wav` | Downloaded through Ari Bradshaw's paid Splice account. | Covered as a Splice Sound incorporated into a video game Creative Work. |
| `public/audio/clicks/ESM_Perfect_Clean_App_Button_Click_2_Organic_Simple_Classic_Game_Click.wav` | Downloaded through Ari Bradshaw's paid Splice account. | Covered as a Splice Sound incorporated into a video game Creative Work. |

The six Splice downloads should remain visible in Ari Bradshaw's Splice library. Generate a Certified License PDF from that library and retain it with private project records when practical.
