# Slice 3: planning games (Trail and Put the Steps in Order)

## What slice 3 delivers

A third area, planning, with two games, so each day exercises memory, attention and planning.

- **Trail (planning):** circles scattered on a board are tapped in order: numbers only at first
  (1-2-3…), then numbers and letters taking turns (1-A-2-B-3-C…), from 5 to 12 circles. A line
  joins each circle done to the one before, and a done circle gets a ✓. A wrong tap only gets a
  hint ("The next one is B.") and play goes on. No clock: the round is right with few wrong taps.
- **Put the Steps in Order (planning):** the steps of an everyday task ("Make a cup of tea"), as
  shuffled cards. Tapping a card adds it as the next step of a numbered list; Undo takes the last
  one back; Done checks it. Levels go from 3 to 6 steps, and the higher ones add a step of another
  task, to be left out. A wrong order shows the right one, numbered, calmly.
- **One game of each area a day:** a memory game (Shopping List, Pairs or Sequences in turn), Odd
  One Out, and a planning game (Trail or Put the Steps in Order in turn), 3 rounds each. All six
  combinations come round in six days.
- **Instructions:** each new game starts with one sentence, written and spoken (Piper clips), with
  "Listen" and a "Show me" example.

## Not in slice 3

- Trail with a pen or a dragged line (taps only, like the rest of MindKeep).
- Dragging steps into place (taps and Undo instead).
- Tasks the user writes.

## Decisions

- **Circles never overlap:** each sits in its own cell of a 4×4 grid, with a small jitter so the
  board does not look like a grid, and they are at least 64 px wide on a phone.
- **The next circle is not highlighted:** finding it is the exercise. The hint only comes after
  a wrong tap.
- **A placed step leaves the cards**, so the list of cards gets shorter as the order grows, and
  Undo puts it back. Done waits until the order has as many steps as the task.
- **Per-area rotation:** each area plays one of its games, in turn by the calendar day. Areas with
  3 and 2 games give 6 different days before they repeat. If a session ever plays more games than
  there are areas, the extra places rotate among the other games.

## Acceptance criteria

Each criterion lists its tests. `tests/project.test.ts` (S1_AC14) checks that this list and the
tests agree.

### S3_AC1: The rules of Trail

Labels are numbers (1-2-3…) or numbers and letters taking turns (1-A-2-B…). Circles sit in
different cells of the board, near each cell's centre, so they never overlap. Only the next
circle moves on; another circle not yet done counts a miss; one already done changes nothing. A
round is right when every circle is done with at most the level's misses.

- `tests/trail.test.ts::test_S3_AC1_numbers_come_first_then_numbers_and_letters_take_turns`
- `tests/trail.test.ts::test_S3_AC1_circles_sit_in_different_cells_so_they_never_overlap`
- `tests/trail.test.ts::test_S3_AC1_only_the_next_circle_moves_on_and_a_wrong_one_counts_a_miss`

### S3_AC2: The Trail screen

Circles are real buttons named by their label ("Circle A"; "Circle A, done" once done), and a done
circle gets a ✓ and a thick border, with a line from the circle before. A wrong tap says which one
is next, and play goes on. When every circle is joined the round ends with "Well done" or a calm
message with the misses.

- `tests/planning_ui.test.ts::test_S3_AC2_circles_are_buttons_named_by_their_label_and_marked_when_done`
- `tests/planning_ui.test.ts::test_S3_AC2_a_wrong_circle_gets_a_hint_and_play_goes_on`
- `tests/planning_ui.test.ts::test_S3_AC2_every_circle_joined_ends_the_round_calmly`

### S3_AC3: The rules of Put the Steps in Order

A round keeps the task's steps in their own order (some may be skipped at lower levels) and
shuffles the cards; at levels with an extra step, it comes from another task. Steps are chosen
one by one (not twice, not more than the task has), Undo takes the last back, and the order is
right only when it is exactly the task's steps.

- `tests/steps.test.ts::test_S3_AC3_a_round_keeps_the_tasks_steps_in_their_order_and_shuffles_the_cards`
- `tests/steps.test.ts::test_S3_AC3_an_extra_step_comes_from_another_task`
- `tests/steps.test.ts::test_S3_AC3_steps_are_chosen_one_by_one_undone_and_checked_in_order`

### S3_AC4: The Put the Steps in Order screen

The task's title is shown. Tapped steps build a numbered "Your order" list and leave the cards;
Undo puts the last one back; Done waits for a full list. The right order says "Well done"; a wrong
one shows the right order numbered and marks the extra step "Not part of this task".

- `tests/planning_ui.test.ts::test_S3_AC4_tapped_steps_build_a_numbered_order_that_undo_takes_back`
- `tests/planning_ui.test.ts::test_S3_AC4_the_right_order_says_well_done`
- `tests/planning_ui.test.ts::test_S3_AC4_a_wrong_order_shows_the_right_one_numbered_and_the_extra_step_marked`

### S3_AC5: Levels and tasks are content, checked when they load

`trail_levels.json` (4 to 16 circles), `steps_levels.json` (3 to 6 steps, with or without an
extra step) and `tasks.json` (at least 2 tasks of 6 different steps) load, and each Steps level is
harder than the one before. A session plays at least one game per area.

- `tests/content.test.ts::test_S3_AC5_trail_and_steps_levels_and_tasks_load_and_get_harder`
- `tests/content.test.ts::test_S3_AC5_trail_and_steps_content_that_breaks_a_rule_is_refused`

### S3_AC6: One game of each area a day

Each day plays one memory, one attention and one planning game, each area's games in turn, so all
six combinations come round in six days. Places beyond one per area rotate among the other games.

- `tests/session.test.ts::test_S3_AC6_every_area_plays_once_a_day_and_all_pairs_come_round_in_six_days`
- `tests/session.test.ts::test_S3_AC6_slots_beyond_one_per_area_rotate_among_the_other_games`

### S3_AC7: Instructions written, spoken and shown

Trail and Put the Steps in Order start with their sentence on screen and said aloud, and "Show me"
shows an example: a short trail 1-A-2 joined by lines, or three steps of a task in order.

- `tests/planning_ui.test.ts::test_S3_AC7_trail_and_steps_start_with_instructions_spoken_and_an_example`

### S3_AC8: The sandbox demo plays the new games

`./run-sandbox.sh` also plays days with Trail and with Put the Steps in Order (a wrong tap, a
wrong order) and saves their screens.

- `tests/e2e/demo.spec.ts::test_S3_AC8_the_demo_plays_the_days_with_trail_and_steps`
