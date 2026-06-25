# Beach scene sprites

Drop two files here. The game uses them automatically once `USE_SPRITE = true`
in `dog-game.js`. If a file is missing or fails to load, the game falls back to
the procedural mock (never a blank box).

## dog.png (sprite sheet)
- Grid of 256x256 cells, transparent background (PNG).
- One state per row, frames left to right:
  - Row 0: idle, 4 frames (gentle breathing, sitting/standing at rest)
  - Row 1: run, 6 frames (full run cycle, facing RIGHT; code mirrors for left)
  - Row 2: pickup, 3 frames (lowering head, grabbing the ball)
  - Row 3: carry/return, 6 frames (running RIGHT with the ball in the mouth)
- The dog must face RIGHT in every frame. The engine flips horizontally for the
  left direction.
- Mouth anchor (where the ball sits when carried): about x=196, y=150 inside a
  256x256 cell. Keep the mouth near that point across the carry frames, or tell
  me the real anchor and I will update `SPRITES.mouth` in `dog-game.js`.

## ball.png
- A single tennis ball, ~64x64, transparent background, centered.

## AI generation prompt (starting point)
"A cute cartoon dog character sheet, side view facing right, flat soft shading,
transparent background, consistent character across frames. Produce a 4-row
sprite sheet on a 256x256 grid: row 1 idle breathing (4 frames), row 2 running
cycle (6 frames), row 3 lowering head to grab a ball (3 frames), row 4 running
while carrying a green tennis ball in the mouth (6 frames). Even spacing, each
pose centered in its cell, feet on the cell baseline."
