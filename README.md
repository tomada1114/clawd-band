# clawd-band

珊瑚色のドット絵の猫が、プロンプト入力欄のすぐ上に住み着いて、Claude Code が
いまやっていることに反応して動きます。

Claude Mod（function hooks）です。**描画しかしません** — ファイルの読み書きも、
通信も、設定の保存もしません。

> 非公式のファン制作物です。色と丸い体は Anthropic の Claude マスコット（通称 Clawd）に
> 着想を得ていますが、ドットはすべて自分で描いたもので、Anthropic とは無関係です。

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

## どう動くか

| 状態 | きっかけ | 見た目 |
|---|---|---|
| `idle` | ターンとターンのあいだ | ゆっくり息をする |
| `sleep` | 27 秒ほど放置 | 耳を倒し、目を閉じ、`z` が流れる |
| `think` | ターン開始、未知のツール | 目が上を向き、ひらめきが飛ぶ |
| `edit` | `Edit` `Write` `MultiEdit` `NotebookEdit` | 右耳のわきで鉛筆を動かす |
| `search` | `Read` `Grep` `Glob` `WebFetch` `WebSearch` `Task` | 頭ごと左、そして右へ首を伸ばす |
| `shell` | `Bash` `BashOutput` `KillShell` | 耳を倒し、火花が散り、口を開けて鳴く |
| `ouch` | ツールがエラーを返した | 目をぎゅっとつぶって体が揺れる |

## 入れる

Claude Code 2.1.273 以降 + ターミナル（デスクトップ版・IDE では出ません）。

```bash
claude plugin marketplace add tomada1114/clawd-band
claude plugin install clawd-band@clawd-band
```

git clone は不要です。

## 動かす

function hooks は early access なので、環境変数を渡して起動します。

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude
```

**これを忘れると、エラーも警告も出ずにただ猫が出ません。** 出ないときはまずここです。
毎回打つのが面倒ならエイリアスにしてください。

```bash
alias claude='CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude'
```

## 消す

```bash
claude plugin uninstall clawd-band
claude plugin marketplace remove clawd-band
```

設定にも `$.store` にも何も書き込まないので、痕跡は残りません。

## 描き替える

猫は [`plugins/clawd-band/hooks/sprites.ts`](plugins/clawd-band/hooks/sprites.ts) に
アスキーアートで直書きされています。1 フレームが 13 文字 × 9 行、1 文字が 1 ピクセル
（ターミナルのセルは縦長なので、横 2 列ぶん使って描画）。

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

```
  .  透過      #  体      *  つや      %  影      i  耳の内側    n  ひげ
  e  目        x  つぶった目           m  鼻と口  o  開いた口
  z  寒色（zzz、虫眼鏡）   y  暖色（火花、鉛筆）   r  警告
```

文字を書き換えて再起動すれば絵が変わります。PNG も変換スクリプトもビルドもありません。
耳と頭はアートそのものなので、耳を倒したり頭ごと傾けたりできます。
状態を足すときは `MascotState` `FRAMES` `CAPTIONS` `CAPTION_COLORS` の 4 か所に。

clone して直接動かす場合:

```bash
git clone https://github.com/tomada1114/clawd-band.git
cd clawd-band
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/clawd-band
```

## 仕組み

`AbovePrompt` の帯に `Raster`（セルのグリッド）を 1 枚置き、`$.ui.blit` でその場で
塗り替えています。再描画が要るのはキャプションも変わる状態遷移のときだけです。
状態機械は `turn.start` / `turn.complete` / `tool.call` / `session.start` の 4 フック。

```bash
claude plugin validate plugins/clawd-band   # 触る API が全部出ます
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test plugins/clawd-band
```

## ライセンス

MIT
