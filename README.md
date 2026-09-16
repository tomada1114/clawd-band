# clawd-band

A coral pixel cat lives in the band above your prompt and reacts to what Claude
Code is doing. It thinks, edits, cranes its head after a search, yowls in a
shell, screws its eyes shut when a tool bites back, and folds its ears down to
sleep if you leave it alone.

It is a **Claude Mod**: an ordinary plugin whose behaviour is a TypeScript hooks
module rather than shell commands. It draws and nothing else — no input, no
persistence, no pet to feed.

> **Unofficial fan work.** The mascot takes its colour and its round, soft blob
> body from Anthropic's Claude mascot, affectionately known as Clawd, and gives
> it a pair of ears. Every pixel here is drawn from scratch; none of it is
> Anthropic's artwork, and this project is not affiliated with or endorsed by
> Anthropic.

```
      ██        ██
    ██▒▒██    ██▒▒██
      ████████████
    ████████████████
  ████░░████████░░████
██████████████████████
    ██████░░██░░██████
      ████████████
        ████████
      clawd is thinking
```

(The real thing is coral, and it moves. The sheet below is the whole cast.)

## What it does

| State | When | What you see |
|---|---|---|
| `idle` | between turns | a slow breath in and out |
| `sleep` | ~27 seconds of quiet | ears fold down, eyes shut, a `z` drifting off |
| `think` | a turn started, or a tool this mod does not know | eyes roll up, ideas pop between the ears |
| `edit` | `Edit`, `MultiEdit`, `Write`, `NotebookEdit` | a pencil stub jabbing past the right ear |
| `search` | `Read`, `Grep`, `Glob`, `WebFetch`, `WebSearch`, `Task` | the whole head cranes left, then right, after the glass |
| `shell` | `Bash`, `BashOutput`, `KillShell` | ears back, sparks off the top, a yowl |
| `ouch` | any tool that came back with an error | ears flat, eyes screwed shut, the whole cat wobbles |

A flinch owns the blob for about 1.6 seconds however busy things get, then it
returns to whatever it was doing — or to waiting, if the turn ended meanwhile.

## Requirements

- Claude Code **2.1.273** or newer
- `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` — without it, a hooks module is ignored
  with no warning at all
- A terminal; the band is drawn on the `terminal` surface only

## Try it

```bash
git clone https://github.com/tomada1114/clawd-band
cd clawd-band
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir .
```

Then ask it to do something. Grep for a word, edit a file, run a failing shell
command, and watch the band.

## Redrawing the mascot

The whole mascot is text in [`hooks/sprites.ts`](hooks/sprites.ts). Every frame
is nine rows of thirteen characters; one character is one pixel, drawn two
terminal columns wide because a terminal cell is about twice as tall as it is
wide. The ears and the head are part of the art rather than an overlay, so a
state can fold the ears back, perk them up, or lean the whole head to one side.

```
  .  nothing (the terminal's own background shows through)
  #  body            *  sheen              %  body shade
  i  inner ear       n  whisker
  e  eye             x  squeezed eye       m  nose and mouth    o  open mouth
  z  cool accent (zzz, the magnifier)      y  warm accent (sparks, pencil)
  r  alarm accent
```

```ts
  idle: [
    [
      '...#.....#...',
      '..#i#...#i#..',
      '...#*#####...',
      '..#########..',
      '.##e#####e##.',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
    // ...
  ],
```

Change a character, reload, and the blob changes. There is no PNG, no conversion
script, no build step — the point is that the art reads in a diff and anyone who
forks this can redraw it in place. `PALETTE` maps each character to a colour;
frames within a state cycle at one tick each, so adding a frame lengthens the
animation.

If you add a state, add it to `MascotState`, `FRAMES`, `CAPTIONS` and
`CAPTION_COLORS` — `tests/sprites.test.ts` fails if you miss one.

## How it is built

- One `Raster` in the `AbovePrompt` band. A `Raster` is a fixed grid of
  `[codepoint, foreground, background]` u32 triplets, base64-packed.
- Animation is `$.ui.blit`, which repaints the mounted `Raster` in place at the
  band's frame rate without asking for a redraw. Only a state change — which
  also moves the caption, an ordinary `Text` — costs a `$.ui.invalidate`.
- The state machine is four hooks: `turn.start`, `turn.complete`, `tool.call`
  (which reads the tool's name on the way down and its `isError` on the way
  back), and `session.start`, which starts the frame clock.
- State lives at module scope rather than in `register`'s closure, because the
  static scan Claude Code runs before loading a mod only lets `$` reach a
  function declared at the top of the file.

## Development

```bash
claude plugin validate .                              # works without the flag
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test .
npx -p typescript@5 tsc -p tsconfig.json              # types only, no build
```

`.claude/types/` is regenerated per machine with `/plugin-types` inside a
session; re-run it after every Claude Code update.

## Licence

MIT.
