// The whole mascot, drawn as text.
//
// Every frame is seven rows of nine characters. One character is one pixel; a
// pixel is drawn two terminal columns wide, because a terminal cell is about
// twice as tall as it is wide and a blob wants to be round. Edit the art below
// and the mascot changes — there is no PNG, no build step, no generator.
//
//   .  nothing (the terminal's own background shows through)
//   #  body            *  highlight          %  body shade
//   e  eye             x  dizzy eye          m  mouth          o  open mouth
//   z  cool accent (zzz, the magnifier)      y  warm accent (sparks, pencil)
//   r  alarm accent

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
  '%': 0xa84f34,
  e: 0x2b1a14,
  x: 0x2b1a14,
  m: 0x7a2f1e,
  o: 0x3d1710,
  z: 0x8fb8d8,
  y: 0xf5c542,
  r: 0xe05252,
}

/** Pixels across and down in the art, before the 2x horizontal stretch. */
export const ART_COLUMNS = 9
export const ART_ROWS = 7

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
  // Between turns: a slow breath in and out.
  idle: [
    [
      '.........',
      '..#####..',
      '.#*#####.',
      '##e###e##',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
    [
      '..#####..',
      '.#*#####.',
      '##e###e##',
      '#########',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
  ],

  // Left alone long enough: eyes shut, a z drifting off the top corner.
  sleep: [
    [
      '.......z.',
      '..#####..',
      '.#*#####.',
      '##ee#ee##',
      '#########',
      '.###m###.',
      '..%%%%%..',
    ],
    [
      '........z',
      '..#####..',
      '.#*#####.',
      '##ee#ee##',
      '#########',
      '.###m###.',
      '..%%%%%..',
    ],
    [
      '.........',
      '..#####..',
      '.#*#####.',
      '##ee#ee##',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
  ],

  // Working, nothing more specific: eyes roll up, ideas pop overhead.
  think: [
    [
      '....z....',
      '..#####..',
      '.#*#####.',
      '##e###e##',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
    [
      '...z.z...',
      '..#####..',
      '.#*#####.',
      '#########',
      '##e###e##',
      '.##mmm##.',
      '..%%%%%..',
    ],
  ],

  // Edit / Write: a pencil stub jabbing at the right edge.
  edit: [
    [
      '.........',
      '..#####..',
      '.#*#####.',
      '##e###e#y',
      '########y',
      '.##mmm##.',
      '..%%%%%..',
    ],
    [
      '.........',
      '..#####..',
      '.#*#####y',
      '##e###e#y',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
  ],

  // Grep / Glob / Read: leaning after the magnifier, left then right.
  search: [
    [
      '.........',
      '..#####..',
      'z#*#####.',
      'z#e###e##',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
    [
      '.........',
      '..#####..',
      '.#*#####z',
      '##e###e#z',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
  ],

  // Bash: sparks off the top, because shells are exciting.
  shell: [
    [
      '..y.y.y..',
      '..#####..',
      '.#*#####.',
      '##e###e##',
      '#########',
      '.##mmm##.',
      '..%%%%%..',
    ],
    [
      '.y.y.y.y.',
      '..#####..',
      '.#*#####.',
      '##e###e##',
      '#########',
      '.###o###.',
      '..%%%%%..',
    ],
  ],

  // A tool came back with an error: dizzy eyes, and the whole blob wobbles.
  ouch: [
    [
      '.r.....r.',
      '..#####..',
      '.#*#####.',
      '##x###x##',
      '#########',
      '.##ooo##.',
      '..%%%%%..',
    ],
    [
      'r.......r',
      '.#######.',
      '##*#####.',
      '#x#####x#',
      '#########',
      '.##ooo##.',
      '..%%%%%..',
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
