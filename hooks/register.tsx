/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */

// Never name a local `h` in this file: every JSX tag compiles to a call of `h`,
// which the engine injects as an ambient global.

import type { EngineInterface, On } from 'claude-code'
import {
  CAPTIONS,
  CAPTION_COLORS,
  cellsFor,
  COLUMNS,
  FRAMES,
  ROWS,
  type MascotState,
} from './sprites.ts'

/** How long one frame is held. The band may repaint 30 times a second. */
const FRAME_MS = 180

/** Ticks of nobody asking anything before the blob dozes off (~27s). */
const SLEEP_AFTER_TICKS = 150

/** Ticks a flinch is held before the blob goes back to whatever it was doing. */
const OUCH_TICKS = 9

/** The `Raster`'s address for `$.ui.blit`. */
const RASTER_KEY = 'clawd'

/** Which tools read the world, which ones change it, which ones are a shell. */
const TOOL_STATES: Readonly<Record<string, MascotState>> = {
  Edit: 'edit',
  MultiEdit: 'edit',
  Write: 'edit',
  NotebookEdit: 'edit',
  Read: 'search',
  Grep: 'search',
  Glob: 'search',
  WebFetch: 'search',
  WebSearch: 'search',
  Task: 'search',
  Bash: 'shell',
  BashOutput: 'shell',
  KillShell: 'shell',
}

// The mascot's whole mind. Module scope, not `register`'s closure, because the
// static scan the engine runs before loading only lets `$` reach a function
// declared at the top of the file.
let state: MascotState = 'idle'
let frame = 0
let quietTicks = 0
let ouchTicks = 0
let isWorking = false
/** What to go back to once a flinch or a turn is over. */
let working: MascotState = 'think'
/** The band's current draw, so a blit knows where to land. */
let requestId: string | null = null
let ticking = false

function currentFrame(): readonly string[] {
  const frames = FRAMES[state]
  return frames[frame % frames.length] ?? frames[0]!
}

/**
 * A mounted Raster is repainted in place — no redraw, so the animation costs
 * nothing but the cells.
 */
function paint($: EngineInterface): void {
  if (requestId === null) return
  void $.ui
    .blit({ requestId, key: RASTER_KEY, cells: cellsFor(currentFrame()) })
    .catch(() => {})
}

/** The caption is an element, so a state change asks for a real redraw too. */
function transition($: EngineInterface, next: MascotState): void {
  if (state === next) return
  state = next
  frame = 0
  quietTicks = 0
  $.ui.invalidate('ui.render')
  paint($)
}

function tick($: EngineInterface): void {
  frame += 1
  if (ouchTicks > 0) {
    ouchTicks -= 1
    if (ouchTicks === 0) {
      // Back to work, or back to waiting for the next prompt.
      transition($, isWorking ? working : 'idle')
      return
    }
  } else if (state === 'idle') {
    quietTicks += 1
    if (quietTicks >= SLEEP_AFTER_TICKS) {
      transition($, 'sleep')
      return
    }
  }
  paint($)
}

export function register(on: On) {
  on('session.start', ($, e, next) => {
    if (!ticking) {
      ticking = true
      $.clock.every(FRAME_MS, () => tick($))
    }
    return next(e)
  })

  on('turn.start', ($, e, next) => {
    isWorking = true
    working = 'think'
    if (ouchTicks === 0) transition($, 'think')
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    isWorking = false
    quietTicks = 0
    if (ouchTicks === 0) transition($, 'idle')
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    working = TOOL_STATES[e.tool] ?? 'think'
    // A flinch owns the blob until it wears off, however busy things get.
    if (ouchTicks === 0) transition($, working)

    const result = await next(e)

    if (result.isError === true) {
      ouchTicks = OUCH_TICKS
      transition($, 'ouch')
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    // Other surfaces draw their own band, a survey owns it when one is up, and
    // a band too short for the blob is better left alone.
    if (e.surface !== 'terminal' || e.props.hasSurvey) return next(e)
    if (e.props.maxRows < ROWS + 1) return next(e)

    requestId = e.requestId

    const { Box, Text, Raster } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Raster
          key={RASTER_KEY}
          columns={COLUMNS}
          rows={ROWS}
          cells={cellsFor(currentFrame())}
        />
        <Text color={CAPTION_COLORS[state]} dimColor={state === 'sleep'}>
          {CAPTIONS[state]}
        </Text>
      </Box>
    )
  })
}
