import { describe, expect, test, tier } from 'claude-code/testing'

import {
  ART_COLUMNS,
  ART_ROWS,
  CAPTIONS,
  CAPTION_COLORS,
  cellsFor,
  COLUMNS,
  FRAMES,
  PALETTE,
  ROWS,
  type MascotState,
} from '../hooks/sprites.ts'

tier('user')

const STATES = Object.keys(FRAMES) as MascotState[]

describe('sprites', () => {
  test('every frame is the same rectangle of known characters', async () => {
    for (const state of STATES) {
      for (const [index, frame] of FRAMES[state].entries()) {
        expect(frame.length, `${state} frame ${index} row count`).toBe(ART_ROWS)
        for (const row of frame) {
          expect(row.length, `${state} frame ${index} row "${row}"`).toBe(ART_COLUMNS)
          for (const char of row) {
            expect(char === '.' || char in PALETTE, `${state}: unknown paint "${char}"`).toBe(true)
          }
        }
      }
    }
  })

  test('every state animates and is captioned', async () => {
    for (const state of STATES) {
      expect(FRAMES[state].length, `${state} frame count`).toBeGreaterThan(1)
      expect(CAPTIONS[state].length, `${state} caption`).toBeGreaterThan(0)
      expect(CAPTION_COLORS[state], `${state} caption colour`).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  test('a frame encodes to exactly one cell per column and row', async () => {
    const cells = cellsFor(FRAMES.idle[0]!)
    const bytes = (Uint8Array as unknown as { fromBase64: (s: string) => Uint8Array }).fromBase64(cells)
    // Three little-endian u32 per cell.
    expect(bytes.byteLength).toBe(COLUMNS * ROWS * 3 * 4)
  })

  test('the states are visually distinct from one another', async () => {
    const drawn = new Map<string, MascotState>()
    for (const state of STATES) {
      const cells = cellsFor(FRAMES[state][0]!)
      expect(drawn.has(cells), `${state} draws the same as ${drawn.get(cells)}`).toBe(false)
      drawn.set(cells, state)
    }
  })
})
