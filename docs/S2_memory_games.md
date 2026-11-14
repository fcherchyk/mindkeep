# Slice 2: memory games (Pairs and Sequences)

## What slice 2 delivers

Two more memory games, so the daily session has more variety while it stays about 10 minutes.

- **Pairs (memory):** cards lie face down; two at a time are turned up, and a pair with the same
  picture stays up with a ✓. Two that do not match stay up a moment (1.5 s) and turn back by
  themselves. No clock: a round counts as right when few pairs failed to match. Harder levels
  have more pairs (3 to 8) and allow fewer misses.
- **Sequences (memory):** tiles of a grid light up one by one after the user presses "Watch",
  and the user taps them in the same order. A wrong tap ends the round calmly and numbers the
  right order on the tiles. Harder levels light more tiles, faster, and then on a larger grid
  (3×3 to 4×4).
- **One memory game a day, in turn:** the session plays one game of each area, 3 rounds each,
  taking turns; the memory game is Shopping List, Pairs or Sequences in turn from day to day, and
  Odd One Out (attention) is played every day. The same day always plays the same games, and the
  home lists them. (S3 adds the planning area to this rule.)
- **Instructions:** each new game starts with one sentence, written and spoken (Piper clips),
  with "Listen" and a "Show me" example, like the S1 games.
- **Profiles from slice 1 keep working:** the new games start at level 1.

## Not in slice 2

- Sequences backwards, or with pictures instead of tiles.
- Pairs with a picture and its word as the two halves of a pair.
- Choosing the day's games by hand.

## Decisions

- **"Watch" starts the sequence**, so it never begins by surprise. A tile lights at most once in
  a sequence, so every tap has one right answer.
- **A lit tile changes in fill, border and a white dot**, not in colour alone, and a screen
  reader hears its row and column.
- **Pairs never stops on misses:** the round ends when every pair is found; the misses only
  decide whether it counts as right for the level.
- **The rotation follows the calendar day**, not the number of sessions, so playing again the
  same day gives the same games and the summary compares like with like.

## Acceptance criteria

Each criterion lists its tests. `tests/project.test.ts` (S1_AC14) checks that this list and the
tests agree.

### S2_AC1: The rules of Pairs

A deck holds each picture twice, shuffled. A matching pair stays up; a pair that does not match
counts as a miss and must turn back before a third card can be turned. A matched card or the same
card twice changes nothing. A round is right when every pair is found with at most the level's
misses.

- `tests/pairs.test.ts::test_S2_AC1_a_deck_holds_each_picture_twice_shuffled`
- `tests/pairs.test.ts::test_S2_AC1_a_matching_pair_stays_up_and_a_wrong_pair_counts_and_turns_back`
- `tests/pairs.test.ts::test_S2_AC1_a_round_is_right_with_at_most_the_levels_misses`

### S2_AC2: The Pairs screen

Cards start face down, each a real button with a name ("Card 3, face down"; face up, the
picture's word). Two cards that do not match turn back after 1.5 s, and taps wait meanwhile. A
matching pair stays up with a ✓ and a thick border. When every pair is found the round ends with
"Well done" or a calm message with the number of misses, and the session goes on.

- `tests/memory_ui.test.ts::test_S2_AC2_cards_start_face_down_with_a_name_each`
- `tests/memory_ui.test.ts::test_S2_AC2_two_cards_that_do_not_match_turn_back_after_a_pause`
- `tests/memory_ui.test.ts::test_S2_AC2_a_matching_pair_stays_up_with_a_tick`
- `tests/memory_ui.test.ts::test_S2_AC2_all_pairs_found_ends_the_round_calmly_with_the_misses`

### S2_AC3: The rules of Sequences

A sequence lights distinct tiles of the grid, as many as the level says. The taps must follow the
order; the first wrong tap ends the round. A tile is named by its row and column.

- `tests/sequences.test.ts::test_S2_AC3_a_sequence_lights_distinct_tiles_of_the_grid`
- `tests/sequences.test.ts::test_S2_AC3_the_taps_must_follow_the_order_and_a_wrong_one_ends_the_round`
- `tests/sequences.test.ts::test_S2_AC3_a_tile_is_named_by_its_row_and_column`

### S2_AC4: The Sequences screen

Nothing lights until "Watch" is pressed, and the tiles cannot be tapped while the sequence plays.
Tiles light one at a time with a dot and a thick border, and a live region says "Lit: row 2,
column 3". Then the user is asked (written and, the first time, spoken) to tap them in order. The
right order says "Well done"; a wrong tap ends the round and numbers the right order on the tiles.

- `tests/memory_ui.test.ts::test_S2_AC4_nothing_lights_until_watch_and_the_tiles_wait_meanwhile`
- `tests/memory_ui.test.ts::test_S2_AC4_tiles_light_one_by_one_with_a_mark_and_a_spoken_name`
- `tests/memory_ui.test.ts::test_S2_AC4_the_right_order_says_well_done`
- `tests/memory_ui.test.ts::test_S2_AC4_a_wrong_tap_ends_the_round_and_numbers_the_right_order`

### S2_AC5: Levels are content, checked when they load

`pairs_levels.json` (2 to 8 pairs, misses of 0 or more) and `sequences_levels.json` (grids of
3×3 or 4×4, at least 2 tiles and no more than the grid has, at least 400 ms a step) load, and each
level is harder than the one before. `games.json` says how many games a session plays.

- `tests/content.test.ts::test_S2_AC5_pairs_and_sequences_levels_load_and_get_harder`
- `tests/content.test.ts::test_S2_AC5_pairs_and_sequences_levels_that_break_a_rule_are_refused`

### S2_AC6: One memory game a day, in turn

Each day plays one memory game, Shopping List, Pairs and Sequences in turn, and Odd One Out every
day, 3 rounds each, taking turns. The same day plays the same games, and the home lists only them.

- `tests/session.test.ts::test_S2_AC6_each_day_plays_one_memory_game_in_turn_and_keeps_attention`
- `tests/session.test.ts::test_S2_AC6_the_same_day_plays_the_same_games_again`
- `tests/memory_ui.test.ts::test_S2_AC6_the_home_lists_only_todays_games`

### S2_AC7: Profiles from slice 1 keep working

A profile saved before slice 2 loads as it was, keeps its levels, and starts Pairs and Sequences
at level 1.

- `tests/storage.test.ts::test_S2_AC7_a_profile_from_slice_1_loads_and_the_new_games_start_at_level_1`

### S2_AC8: Instructions written, spoken and shown

Pairs and Sequences start with their sentence on screen and said aloud, and "Show me" shows an
example with the answer marked.

- `tests/memory_ui.test.ts::test_S2_AC8_pairs_and_sequences_start_with_instructions_spoken_and_an_example`

### S2_AC9: The sandbox demo plays the new games

`./run-sandbox.sh` also plays the days with Pairs and with Sequences, so they (a miss, a lit tile,
a wrong order) are in the screenshots.

- `tests/e2e/demo.spec.ts::test_S2_AC9_the_demo_plays_the_days_with_pairs_and_sequences`
