# Slice 1: the MVP

## What slice 1 delivers

A daily session of two calm exercises, for older adults who want to keep their memory and
attention active, on desktop first and on phones and tablets as an installed web app.

- **Profile:** only a first name. Settings for text size (normal, large, larger), spoken
  instructions (on or off) and high contrast. Kept in the browser, never sent anywhere.
- **Today's session:** about 10 minutes, the two games taking turns, three rounds each. A big
  "Start" button, and a calm "Done today" mark once it is played. No streaks.
- **Shopping List (memory):** a shopping list of pictures with their words. The user presses
  "Ready" when it is learnt (no clock), a short pause follows, and then the things that were on
  the list are picked from a larger set. Harder levels have longer lists, longer pauses and, at
  the top, look-alike distractors (other fruit when the list has fruit).
- **Odd One Out (attention):** a grid of figures that are all the same but one. The difference
  gets subtler with the level: another shape, a smaller size, a half turn, a small mark. Figures
  never differ by colour alone.
- **Adaptive difficulty:** three right answers in a row raise a game's level, one wrong answer
  lowers it, so the user is right about 80% of the time. Levels are kept per game and the next
  session starts there.
- **No clock and no losing:** a wrong answer shows the right one calmly ("Not quite. The things on
  the list are marked.") and the session goes on.
- **Instructions written and spoken:** each game starts with one sentence, said aloud with the
  same Piper voice as EduGames, a "Listen" button to hear it again and a "Show me" example.
- **Today's summary:** right answers and the level of each game, compared only with the user's
  own last session ("Up from level 3 last time", "Your first time: a good start").
- **Accessibility:** contrast of at least 7:1, rem sizes, 64 px tap targets 16 px apart, a double
  tap counted once, real buttons, the focus on each screen's title.
- **Installable and offline:** a web app manifest with icons and a service worker that caches
  everything.

## Not in slice 1

- More games (pairs, sequences, trails, symbol matching, change and clocks, words).
- Progress over weeks; a view for a relative or carer; reminders.
- Spanish (adapted, not translated).
- App stores.

## Decisions

- **The user decides when the list is learnt** (a "Ready" button) instead of a timed display:
  nothing is timed in MindKeep. The pause after it is the only wait, and it asks for nothing.
- **Shapes, not colours, in Odd One Out**, so colour blindness never matters; the "rotation"
  levels use a triangle, whose half turn shows.
- **A session played again the same day replaces the day's record**, so the summary is always
  the latest session.
- **The font is shipped in the repo** (Atkinson Hyperlegible, from Fontsource), not loaded from
  the web, so the app works offline.

## Acceptance criteria

Each criterion lists its tests. `tests/project.test.ts` (S1_AC14) checks that this list and the
tests agree.

### S1_AC1: A profile with only a first name

The first visit asks only for a first name: letters, with spaces, hyphens or apostrophes inside,
up to 20 characters. Anything else is refused with a message. The profile starts with the default
settings and is saved at once.

- `tests/profile.test.ts::test_S1_AC1_a_first_name_makes_a_profile_with_the_default_settings`
- `tests/profile.test.ts::test_S1_AC1_anything_but_a_first_name_is_refused`
- `tests/ui.test.ts::test_S1_AC1_the_first_visit_asks_only_for_a_first_name`

### S1_AC2: The profile is saved on the device

The profile is kept in the browser's storage and loads back the same. Damaged data, or data of an
unknown version, is set aside under `mindkeep:profile:corrupt` and the user starts again; a
missing or wrong setting gets its default.

- `tests/storage.test.ts::test_S1_AC2_a_saved_profile_loads_back_the_same`
- `tests/storage.test.ts::test_S1_AC2_damaged_or_unknown_data_is_set_aside_and_the_user_starts_again`
- `tests/storage.test.ts::test_S1_AC2_settings_missing_or_wrong_in_saved_data_get_the_default`

### S1_AC3: Today's session

A session has three rounds of each game, taking turns between memory and attention, and ends when
its rounds are played, whatever the answers. The home shows the session and its games, a "Start"
button, and "Done today" once it is played (then "Play again"). There are no streaks.

- `tests/session.test.ts::test_S1_AC3_a_session_takes_turns_between_areas_with_three_rounds_each`
- `tests/session.test.ts::test_S1_AC3_a_session_ends_when_its_rounds_are_played_whatever_the_answers`
- `tests/ui.test.ts::test_S1_AC3_the_home_shows_todays_session_and_marks_it_done`

### S1_AC4: Shopping List

The list's items are among the choices, with distractors that are not on it, all different. On
"similar" levels the distractors come first from the groups of the list. A round is right only
with every item picked and nothing else. The list stays until "Ready" (no clock); a pause follows
and then the choices. A double tap on a choice counts once.

- `tests/shopping.test.ts::test_S1_AC4_the_list_is_among_the_choices_with_distractors_that_are_not_on_it`
- `tests/shopping.test.ts::test_S1_AC4_similar_levels_take_distractors_from_the_groups_of_the_list`
- `tests/shopping.test.ts::test_S1_AC4_a_round_is_right_only_with_every_item_and_nothing_else`
- `tests/ui.test.ts::test_S1_AC4_shopping_list_waits_for_ready_pauses_then_offers_the_choices`

### S1_AC5: Odd One Out

Exactly one figure differs from the others, and it is the answer. It differs only by the level's
difference: another shape, a smaller size, a half turn (a triangle) or a small mark; never by
colour alone.

- `tests/odd.test.ts::test_S1_AC5_exactly_one_figure_differs_and_it_is_the_answer`
- `tests/odd.test.ts::test_S1_AC5_the_figure_differs_by_the_level_difference_and_never_by_colour_alone`

### S1_AC6: Adaptive difficulty

Three right answers in a row raise a game's level and one wrong answer lowers it, between the
first and the last level of the game. The level is saved per game and the next session starts
there.

- `tests/staircase.test.ts::test_S1_AC6_three_right_in_a_row_raise_the_level_and_one_wrong_lowers_it`
- `tests/staircase.test.ts::test_S1_AC6_the_level_stays_between_the_first_and_the_last`
- `tests/staircase.test.ts::test_S1_AC6_the_level_is_saved_per_game_and_the_next_session_starts_there`

### S1_AC7: No clock and no losing

A wrong answer shows calmly which answer was right (the list's items marked "On the list", the
different figure outlined), and "Next" goes on with the session. Nothing says "lost", "game over"
or "try harder".

- `tests/ui.test.ts::test_S1_AC7_a_wrong_answer_shows_the_right_one_calmly_and_the_session_goes_on`

### S1_AC8: Instructions written and spoken

Each game's first round starts with its instruction, written and said aloud; "Listen" says it
again and "Show me" shows an example with its answer marked. With the voice off nothing is said
and the text stays. Every prompt has its clip.

- `tests/project.test.ts::test_S1_AC8_every_prompt_has_its_clip`
- `tests/ui.test.ts::test_S1_AC8_instructions_are_written_and_spoken_and_can_be_heard_again`
- `tests/ui.test.ts::test_S1_AC8_show_me_marks_the_answer_of_an_example`
- `tests/ui.test.ts::test_S1_AC8_with_the_voice_off_nothing_is_said_and_the_text_stays`

### S1_AC9: Today compared with the user's own past

A finished session is kept as the day's record (a second session the same day replaces it) and
marks the day done. The summary shows, per game, the right answers and the level reached, against
the level at the end of the last earlier session, or "Your first time".

- `tests/profile.test.ts::test_S1_AC9_a_finished_session_is_kept_as_the_day_and_marks_it_done`
- `tests/profile.test.ts::test_S1_AC9_the_summary_compares_with_the_last_earlier_session_only`
- `tests/ui.test.ts::test_S1_AC9_the_summary_shows_today_against_the_users_last_time`
- `tests/ui.test.ts::test_S1_AC9_a_first_session_is_called_a_good_start`

### S1_AC10: Accessibility

Text and controls keep a contrast of at least 7:1 in both themes. Tap targets are at least 64 px
and 16 px apart. Every control is a real button with a name, a double tap counts once, and each
screen puts the focus on its title.

- `tests/taps.test.ts::test_S1_AC10_a_second_tap_on_the_same_thing_soon_after_is_ignored`
- `tests/theme.test.ts::test_S1_AC10_text_and_controls_keep_a_contrast_of_at_least_7_to_1`
- `tests/theme.test.ts::test_S1_AC10_tap_targets_are_at_least_64_px_and_16_px_apart`
- `tests/ui.test.ts::test_S1_AC10_every_control_is_a_real_button_with_a_name`
- `tests/ui.test.ts::test_S1_AC10_each_screen_puts_the_focus_on_its_title`

### S1_AC11: Settings

Text size (normal, large, larger) scales every size of the page; high contrast and the voice can
be turned on and off. Changes apply at once and are saved.

- `tests/theme.test.ts::test_S1_AC11_the_text_size_setting_scales_every_rem`
- `tests/ui.test.ts::test_S1_AC11_settings_change_the_text_size_contrast_and_voice_and_are_saved`

### S1_AC12: The core is apart from the screen

`src/core` never imports Svelte or the UI, and never touches the browser (document, window,
storage, audio).

- `tests/project.test.ts::test_S1_AC12_the_core_never_imports_svelte_or_touches_the_browser`

### S1_AC13: Content per locale

Games, items, levels, strings and prompts load from `src/content/en/`, and content that breaks a
rule is refused with its place. Strings fill their placeholders, a missing key shows itself, every
string used exists and every string is used.

- `tests/content.test.ts::test_S1_AC13_the_english_content_loads`
- `tests/content.test.ts::test_S1_AC13_content_that_breaks_a_rule_is_refused_with_its_place`
- `tests/content.test.ts::test_S1_AC13_strings_fill_their_placeholders_and_a_missing_key_shows_itself`
- `tests/project.test.ts::test_S1_AC13_every_ui_string_used_exists_and_every_string_is_used`

### S1_AC14: Docs, tests and credits agree

Every slice has a doc with its criteria, every criterion has tests, the doc lists exactly the
tests that exist, every test names its criterion, and every asset is credited with an allowed
licence.

- `tests/project.test.ts::test_S1_AC14_every_slice_has_a_doc_with_its_acceptance_criteria`
- `tests/project.test.ts::test_S1_AC14_every_criterion_has_tests_and_the_doc_lists_exactly_those_that_exist`
- `tests/project.test.ts::test_S1_AC14_every_test_names_its_criterion`
- `tests/project.test.ts::test_S1_AC14_every_asset_is_credited_with_an_allowed_licence`

### S1_AC15: The sandbox demo

`./run-sandbox.sh` plays a whole session in a real browser and saves a picture of every screen at
desktop and phone size.

- `tests/e2e/demo.spec.ts::test_S1_AC15_the_demo_plays_a_whole_session_and_saves_every_screen`

### S1_AC16: Installable and offline

The manifest has the app's name, a standalone display and icons of 192 and 512 px; the service
worker caches the scripts, styles, page, font, clips and icons.

- `tests/project.test.ts::test_S1_AC16_the_manifest_makes_it_installable_with_icons_of_192_and_512`
- `tests/project.test.ts::test_S1_AC16_the_service_worker_caches_everything_the_app_needs_offline`
