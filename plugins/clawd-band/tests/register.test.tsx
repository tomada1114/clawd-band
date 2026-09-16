import type { On } from 'claude-code'
import { describe, expect, mock, test, tier } from 'claude-code/testing'

import { CAPTIONS, COLUMNS, ROWS } from '../hooks/sprites.ts'

tier('user')

// The hooks a test registers sit BENEATH the mod, so a passing test answers
// every `$` call the mod makes: ui.blit, ui.invalidate, clock.every, and the
// engine events that drive the state machine.

const BAND_PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 100,
  scroll: {} as never,
  view: {} as never,
}

/** Colours the art uses, by the name the sprite sheet gives them. */
const COOL_ACCENT = 0x8fb8d8
const WARM_ACCENT = 0xf5c542
const ALARM_ACCENT = 0xe05252
const DIZZY_EYE = 0x2b1a14

type Node = { type?: string; props?: Record<string, unknown>; children?: unknown[] }

/** The one `Raster` the band draws, wherever it sits in the tree. */
function findRaster(node: unknown): Node | null {
  if (node === null || typeof node !== 'object') return null
  const n = node as Node
  if (n.type === 'Raster') return n
  for (const child of n.children ?? []) {
    const found = findRaster(child)
    if (found !== null) return found
  }
  return null
}

/** Every foreground colour the drawn frame actually paints. */
function paintedColors(cells: string): Set<number> {
  const bytes = (Uint8Array as unknown as { fromBase64: (s: string) => Uint8Array }).fromBase64(cells)
  const words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
  const seen = new Set<number>()
  for (let i = 0; i < words.length; i += 3) {
    if (words[i] !== 0x20) seen.add(words[i + 1]!)
  }
  return seen
}

/** Answers everything beneath the mod, and returns the clock driving its ticks. */
function world(on: On) {
  const clock = mock.clock(on)
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.invalidate', () => ({ value: undefined }))
  return clock
}

/** Renders the band and hands back its caption text and its painted colours. */
async function band($: { ui: { render: (input: unknown) => Promise<unknown> } }) {
  const tree = await $.ui.render({
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: BAND_PROPS,
  } as never)
  const raster = findRaster(tree)
  return {
    tree,
    json: JSON.stringify(tree),
    raster,
    colors: raster === null ? new Set<number>() : paintedColors(raster.props!['cells'] as string),
  }
}

describe('register', () => {
  test('between turns the blob waits, drawn as one Raster of the right size', async ($, on) => {
    world(on)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.turn.complete({ answer: 'done', durationMs: 10, isAborted: false, turnId: 't1', reason: 'answer' } as never)

    const drawn = await band($ as never)

    expect(drawn.raster).not.toBe(null)
    expect(drawn.raster!.props!['key']).toBe('clawd')
    expect(drawn.raster!.props!['columns']).toBe(COLUMNS)
    expect(drawn.raster!.props!['rows']).toBe(ROWS)
    expect(drawn.json).toContain(CAPTIONS.idle)
  })

  test('a turn starting sets it thinking', async ($, on) => {
    world(on)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.turn.start({ text: 'hello', turnId: 't2' })

    const drawn = await band($ as never)

    expect(drawn.json).toContain(CAPTIONS.think)
    expect(drawn.colors.has(COOL_ACCENT)).toBe(true)
  })

  test('an edit tool puts a pencil in its hand', async ($, on) => {
    world(on)
    on('tool.call', () => ({ result: 'ok' }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.tool.call({ tool: 'Write', file_path: '/work/a.txt', content: 'hi' } as never)

    const drawn = await band($ as never)

    expect(drawn.json).toContain(CAPTIONS.edit)
    expect(drawn.colors.has(WARM_ACCENT)).toBe(true)
  })

  test('a search tool sends it looking around', async ($, on) => {
    world(on)
    on('tool.call', () => ({ result: 'ok' }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.tool.call({ tool: 'Grep', pattern: 'clawd' } as never)

    const drawn = await band($ as never)

    expect(drawn.json).toContain(CAPTIONS.search)
    expect(drawn.colors.has(COOL_ACCENT)).toBe(true)
  })

  test('Bash drops it into the shell, sparks and all', async ($, on) => {
    world(on)
    on('tool.call', () => ({ result: 'ok' }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.tool.call({ tool: 'Bash', command: 'ls' } as never)

    const drawn = await band($ as never)

    expect(drawn.json).toContain(CAPTIONS.shell)
    expect(drawn.colors.has(WARM_ACCENT)).toBe(true)
  })

  test('a tool that errors makes it flinch, then it goes back to work', async ($, on) => {
    const clock = world(on)
    on('tool.call', () => ({ isError: true, result: 'boom', text: 'boom' }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.turn.start({ text: 'go', turnId: 't3' })
    await $.tool.call({ tool: 'Bash', command: 'false' } as never)

    const hurt = await band($ as never)
    expect(hurt.json).toContain(CAPTIONS.ouch)
    expect(hurt.colors.has(ALARM_ACCENT)).toBe(true)
    expect(hurt.colors.has(DIZZY_EYE)).toBe(true)

    // The flinch wears off after its ticks and the turn is still running.
    await clock.advance(180 * 10)

    const recovered = await band($ as never)
    expect(recovered.json).toContain(CAPTIONS.shell)
    expect(recovered.colors.has(ALARM_ACCENT)).toBe(false)
  })

  test('left alone long enough it falls asleep', async ($, on) => {
    const clock = world(on)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.turn.complete({ answer: 'done', durationMs: 10, isAborted: false, turnId: 't4', reason: 'answer' } as never)

    const awake = await band($ as never)
    expect(awake.json).toContain(CAPTIONS.idle)

    await clock.advance(180 * 151)

    const asleep = await band($ as never)
    expect(asleep.json).toContain(CAPTIONS.sleep)
    expect(asleep.colors.has(COOL_ACCENT)).toBe(true)
  })

  test('a survey owns the band, so the blob steps aside', async ($, on) => {
    world(on)
    on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>BENEATH</Text>
    })
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    const tree = await $.ui.render({
      surface: 'terminal',
      component: 'AbovePrompt',
      requestId: 'band',
      props: { ...BAND_PROPS, hasSurvey: true },
    } as never)

    expect(JSON.stringify(tree)).toContain('BENEATH')
  })

  test('a band too short for the blob is left alone', async ($, on) => {
    world(on)
    on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>BENEATH</Text>
    })
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    const tree = await $.ui.render({
      surface: 'terminal',
      component: 'AbovePrompt',
      requestId: 'band',
      props: { ...BAND_PROPS, maxRows: 4 },
    } as never)

    expect(JSON.stringify(tree)).toContain('BENEATH')
  })
})
