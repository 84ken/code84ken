/* =========================================================
   ゲームアルバム データファイル
   新しいゲームができたら、このファイルに1件追加するだけ！
   ========================================================= */

/* --- サイト設定 --- */
const SITE = {
  title: "うちのこゲームミュージアム",
  tagline: "子どもの絵をあつめる時代から、子どもがつくったゲームをあつめる時代へ。",
};

/* --- 家族設定 ---
   birthday を設定すると「つくったとき ◯さい」が自動計算されます
   （例: "2016-04-12"）。設定しない場合は、各ゲームの age 欄が使われます。 */
const FAMILY = {
  kotaro: { name: "光太郎", birthday: null, color: "#cde8ff", emoji: "🦖" },
  hana:   { name: "はな",   birthday: null, color: "#ffd6e0", emoji: "🐰" },
};

/* --- 作品リスト ---
   file  : ゲームのHTMLファイル名（このフォルダに置く）
   title : ゲームのタイトル
   maker : "kotaro" / "hana" / ["kotaro","hana"]（合作）
   date  : つくった日 "YYYY-MM-DD"。日にちが不明なら "YYYY-MM" でもOK
   age   : つくったときの年齢。誕生日を設定していればこの欄は不要（自動計算）。
           合作のときは { kotaro: 10, hana: 3 } のように書く
   emoji : サムネイルが読み込めないときに表示される絵文字
   memo  : 思い出メモ。どんなアイディアだったか、ボイスメモで何と言っていたか等
   sketch: 原画（アイディアの絵）。1枚なら "sketches/xxx.jpg"、
           複数なら [{ src: "sketches/xxx.jpg", label: "せつめい" }, ...]（なければ null）
   ---------------------------------------------------------
   ▼新しいゲームを追加するときは、この形をコピーして下に足す▼
   {
     file: "new-game.html",
     title: "あたらしいゲーム",
     maker: "kotaro",
     date: "2026-08-01",
     age: 10,
     emoji: "🎮",
     memo: "どんなゲームか、作ったときのエピソード",
     sketch: null,
   },
*/
const GAMES = [
  {
    file: "kuma-game_1.html",
    title: "すてられちゃった くまちゃん",
    maker: "hana",
    date: "2026-07",
    age: 3,
    emoji: "🧸",
    memo: "まちがえてすてられちゃったくまちゃんが、しかえしにやってきた！かくれながら「はり・いと・ボタン」をあつめて、うしろからそーっとなおしてあげるステルスゲーム。",
    sketch: [
      { src: "sketches/kuma-namida.jpg",   label: "ないてるくまちゃん" },
      { src: "sketches/kuma-kowareta.jpg", label: "こわれたくまちゃん" },
      { src: "sketches/kuma-egao.jpg",     label: "えがおのくまちゃん" },
    ],
  },
  {
    file: "pk-game_1.html",
    title: "モフモフキーパーのPKゲーム",
    maker: "hana",
    date: "2026-07",
    age: 3,
    emoji: "⚽",
    memo: "モフモフのキーパーとPK対決！コースをえらんでシュートをきめよう。",
    sketch: [
      { src: "sketches/pk-keeper.jpg", label: "モフモフキーパー" },
      { src: "sketches/pk-goal.jpg",   label: "ゴールのばめん" },
    ],
  },
  {
    file: "yari-game-boss.html",
    title: "槍が出てくるゲーム 〜ボスとうじょう〜",
    maker: "kotaro",
    date: "2026-07",
    age: 10,
    emoji: "🗡️",
    memo: "つぎつぎ出てくる槍をよけまくるアクション。ついにボスもとうじょう！企画書には難易度3段階・槍の出現パターン4種・ボス3体のHPまで設計されている。",
    sketch: [
      { src: "sketches/yari-kikaku1.jpg", label: "きかくしょ（なんいど）" },
      { src: "sketches/yari-kikaku2.jpg", label: "やりのパターン4しゅ" },
      { src: "sketches/yari-boss.jpg",    label: "ボスせっけいず" },
    ],
  },
];
