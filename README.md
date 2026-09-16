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

日本語の導入は [日本語ではじめる](#日本語ではじめる) にあります。

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

## 日本語ではじめる

Mod を作ったことがない人向けの手順です。

### これは何か

Claude Code の **Mod**（function hooks）です。Mod は普通のプラグインの一種ですが、
中身がシェルスクリプトではなく TypeScript のフックモジュールになっていて、
Claude Code 自身の画面を描き換えられます。

この Mod は、プロンプト入力欄のすぐ上にある帯（AbovePrompt バンド）にドット絵の猫を
常駐させて、Claude がいまやっていることに反応して動かします。**描画しかしません** —
ファイルの読み書きも、通信も、設定の保存もしません。

### 必要なもの

- Claude Code **2.1.273** 以降（`claude --version` で確認）
- ターミナルで動く Claude Code。帯は `terminal` サーフェスにしか描かれないので、
  デスクトップ版や IDE 拡張の中では出ません
- git

### 動かす

```bash
git clone https://github.com/tomada1114/clawd-band.git
cd clawd-band
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir .
```

初回は「このフォルダを信頼しますか」と聞かれるので Yes を選びます。
入力欄のすぐ上に猫が出てくれば成功です。

あとは普通に頼みごとをしてください。ファイルを読ませる、編集させる、
`false` のような失敗するコマンドを実行させる — そのたびに猫の表情と耳が変わります。

### `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` は何なのか

function hooks はまだ early access で、この環境変数がゲートになっています。
**付け忘れるとフックモジュールはエラーも警告も出さずに黙って無視されます。**
`--plugin-dir` を指定していても、起動は成功して、ただ猫が出ません。
「動かない」ときはまずここを疑ってください。

### 毎回打つのが面倒なとき

`~/.claude/settings.json` に `env` を足すと、環境変数のほうは省けます。

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  }
}
```

`--plugin-dir` のほうは起動ごとに必要なので、パスを固定してエイリアスにしておくのが楽です。

```bash
alias claude-cat='claude --plugin-dir ~/ghq/github.com/tomada1114/clawd-band'
```

### やめかた

`--plugin-dir` を外して起動するだけです。この Mod は設定ファイルにも `$.store` にも
何も書き込まないので、痕跡は残りません。clone したフォルダを消せば完全に消えます。

### 知らない Mod を動かす前に

Mod は Claude Code のプロセス内で動くので、動かす前に中身を確認できると安心です。
`claude plugin validate` は**コードを実行せずに**ソースを静的に走査して、
その Mod が登録するイベントと呼び出す API を全部並べてくれます。

```
$ claude plugin validate .

  ❯ ./register.tsx hooks: session.start, turn.start, turn.complete, tool.call, ui.render{component=AbovePrompt}
  ❯ ./register.tsx calls: $.clock.every, $.ui.blit (via paint), $.ui.invalidate (via transition), $.ui.resolve

✔ Validation passed
```

この Mod が触るのはタイマー（`$.clock.every`）と描画（`$.ui.*`）だけで、
ファイル・ネットワーク・保存領域には一切触っていないことがこの一覧で分かります。
このコマンドは環境変数なしでも動きます。

### うまく出ないとき

| 症状 | 原因 |
|---|---|
| 猫が出ない | `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` の付け忘れ。9割これです |
| フラグを付けても出ない | ターミナルの高さが足りない。帯には 10 行必要で（猫 9 行 + キャプション 1 行）、足りないと描画をスキップします |
| デスクトップ版・IDE で出ない | 仕様です。`terminal` サーフェス限定です |
| 起動時にエラーが出る | `claude --version` が 2.1.273 未満かもしれません |
| 色が思ったより地味 | 24bit カラー非対応のターミナルだと近い色に丸められます。256 色でも顔は読めます |

### 自分で描き替える

猫は [`hooks/sprites.ts`](hooks/sprites.ts) にアスキーアートで直書きされています。
1 フレームが 13 文字 × 9 行、1 文字が 1 ピクセルです。文字を書き換えて Claude Code を
再起動すれば、それだけで絵が変わります。PNG も変換スクリプトもビルドもありません。
詳しくは下の [Redrawing the mascot](#redrawing-the-mascot) を見てください。

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
