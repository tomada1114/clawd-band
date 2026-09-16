// The whole mascot, drawn as text.
//
// Every frame is nine rows of thirteen characters. One character is one pixel;
// a pixel is drawn two terminal columns wide, because a terminal cell is about
// twice as tall as it is wide and the blob wants to be round. Edit the art
// below and the mascot changes — there is no PNG, no build step, no generator.
//
//   .  nothing (the terminal's own background shows through)
//   #  body            *  sheen               %  body shade
//   i  inner ear       n  whisker
//   e  eye             x  dizzy eye           m  nose and mouth      o  open mouth
//   z  cool accent (zzz, the magnifier)       y  warm accent (sparks, pencil)
//   r  alarm accent
//
// The ears and the head are part of the art, not an overlay, so a state can
// fold the ears back, perk them up, or lean the whole head to one side.

/** A colour as `Raster` wants it: 0x00RRGGBB. */
type Rgb = number

/** `Raster`'s sentinel for "whatever the terminal already uses". */
const DEFAULT_COLOR = 0x01000000

const FULL_BLOCK = 0x2588
const SPACE = 0x20

/** Coral, because the mascot this one is a fan of is coral. */
export const PALETTE: Readonly<Record<string, Rgb>> = {
  '#': 0xd97757,
  '*': 0xf3b394,
  '%': 0xbe6144,
  i: 0xe89a8c,
  n: 0xffe4d6,
  e: 0x2b1a14,
  x: 0x2b1a14,
  m: 0x5e2317,
  o: 0x3d1710,
  z: 0x8fb8d8,
  y: 0xf5c542,
  r: 0xe05252,
}

/** Pixels across and down in the art, before the 2x horizontal stretch. */
export const ART_COLUMNS = 13
export const ART_ROWS = 9

/** How many terminal cells wide one art pixel is drawn. */
export const PIXEL_WIDTH = 2

export const COLUMNS = ART_COLUMNS * PIXEL_WIDTH
export const ROWS = ART_ROWS

/** What the mascot can be doing. */
export type MascotState =
  | 'idle'
  | 'sleep'
  | 'think'
  | 'edit'
  | 'search'
  | 'shell'
  | 'ouch'

export type Frame = readonly string[]

/**
 * The flipbook. Frames cycle in order at one tick each, so a two-frame state
 * breathes and a three-frame state drifts.
 */
export const FRAMES: Readonly<Record<MascotState, readonly Frame[]>> = {
  // Between turns: ears up, a slow breath in and out.
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
    [
      '...#.....#...',
      '..#i#...#i#..',
      '..#*#######..',
      '.###########.',
      '.##e#####e##.',
      'n#####m#####n',
      '.####m#m####.',
      '..#########..',
      '...%%%%%%%...',
    ],
  ],

  // Left alone long enough: ears folded, eyes shut, a z drifting off.
  sleep: [
    [
      '.........z...',
      '..##.....##..',
      '...#*#####...',
      '..#########..',
      '.##ee###ee##.',
      'n#####m#####n',
      '..#########..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      '..........z..',
      '..##.....##..',
      '...#*#####...',
      '..#########..',
      '.##ee###ee##.',
      'n#####m#####n',
      '..#########..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      '.............',
      '..##.....##..',
      '..#*#######..',
      '.###########.',
      '.##ee###ee##.',
      'n#####m#####n',
      '.###########.',
      '..#########..',
      '...%%%%%%%...',
    ],
  ],

  // Working, nothing more specific: eyes roll up, ideas pop overhead.
  think: [
    [
      '...#..z..#...',
      '..#i#...#i#..',
      '...#*#####...',
      '..#e#####e#..',
      '.###########.',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      '...#.z.z.#...',
      '..#i#...#i#..',
      '...#*#####...',
      '..#########..',
      '.##e#####e##.',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
  ],

  // Edit / Write: a pencil stub jabbing past the right ear.
  edit: [
    [
      '...#.....#...',
      '..#i#...#i#..',
      '...#*#####...',
      '..#########y.',
      '.##e#####e#y.',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      '...#.....#...',
      '..#i#...#i#..',
      '...#*#####.y.',
      '..#########y.',
      '.##e#####e##.',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
  ],

  // Grep / Glob / Read: the whole head cranes left, then right, after the glass.
  search: [
    [
      '..#.....#..z.',
      '.#i#...#i#...',
      '..#*#####....',
      '.#########...',
      '##e#####e##..',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      '.z..#.....#..',
      '...#i#...#i#.',
      '....#*#####..',
      '...#########.',
      '..##e#####e##',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
  ],

  // Bash: ears back, sparks off the top, and a yowl on the second frame.
  shell: [
    [
      '..y.y...y.y..',
      '..##.....##..',
      '...#*#####...',
      '..#########..',
      '.##e#####e##.',
      'n#####m#####n',
      '..###m#m###..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      '.y.y.y.y.y.y.',
      '..##.....##..',
      '...#*#####...',
      '..#########..',
      '.##e#####e##.',
      'n#####m#####n',
      '..###ooo###..',
      '...#######...',
      '....%%%%%....',
    ],
  ],

  // A tool came back with an error: ears flat, eyes crossed, the cat wobbles.
  ouch: [
    [
      '.r.........r.',
      '..##.....##..',
      '...#######...',
      '..#x#####x#..',
      '.###x###x###.',
      '###x#####x###',
      '..###ooo###..',
      '...#######...',
      '....%%%%%....',
    ],
    [
      'r.........r..',
      '...##.....##.',
      '....#######..',
      '...#x#####x#.',
      '..###x###x###',
      '.###x#####x##',
      '...###ooo###.',
      '....#######..',
      '.....%%%%%...',
    ],
  ],
}

/** The line under the mascot. */
export const CAPTIONS: Readonly<Record<MascotState, string>> = {
  idle: 'clawd is waiting',
  sleep: 'clawd is asleep  z z z',
  think: 'clawd is thinking',
  edit: 'clawd is editing',
  search: 'clawd is looking around',
  shell: 'clawd is in the shell',
  ouch: 'ouch! that tool bit back',
}

/** The caption colour, so the line matches whatever the blob is up to. */
export const CAPTION_COLORS: Readonly<Record<MascotState, string>> = {
  idle: '#d97757',
  sleep: '#8fb8d8',
  think: '#8fb8d8',
  edit: '#f5c542',
  search: '#8fb8d8',
  shell: '#f5c542',
  ouch: '#e05252',
}

/**
 * One frame's art to the base64 `cells` a `Raster` takes: `columns * rows`
 * little-endian u32 triplets of `[codePoint, foreground, background]`.
 */
export function cellsFor(frame: Frame): string {
  const words = new Uint32Array(COLUMNS * ROWS * 3)
  for (let y = 0; y < ROWS; y++) {
    const row = frame[y] ?? ''
    for (let ax = 0; ax < ART_COLUMNS; ax++) {
      const paint = PALETTE[row[ax] ?? '.']
      for (let sub = 0; sub < PIXEL_WIDTH; sub++) {
        const i = (y * COLUMNS + ax * PIXEL_WIDTH + sub) * 3
        words[i] = paint === undefined ? SPACE : FULL_BLOCK
        words[i + 1] = paint === undefined ? DEFAULT_COLOR : paint
        words[i + 2] = DEFAULT_COLOR
      }
    }
  }
  // Uint8Array.prototype.toBase64 is in the hooks environment but not in the
  // es2023 lib the tsconfig names, so the cast is the whole of the workaround.
  const bytes = new Uint8Array(words.buffer) as unknown as { toBase64: () => string }
  return bytes.toBase64()
}
