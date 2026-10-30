<?php
/*
 * アイデアへのスタンプ（いいね）を数える
 *   GET  api/reactions.php?set=yokoze2026          → {"counts":{"1":{"like":3,...},...}}
 *   POST api/reactions.php  set=yokoze2026&id=1&stamp=like → {"ok":true,"counts":{...その1件}}
 * 文字のコメントは受け付けない（子どもの作品なので、スタンプだけ）。
 * データは同じフォルダの *.data.php に保存（直接開かれても PHP として即終了するので中身は見えない）。
 * データファイルはリポジトリに入れない（デプロイで上書きされないように）。
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const SETS   = ['yokoze2026' => 47];               // 掲載中のアイデア集と件数
const STAMPS = ['like', 'want', 'yummy'];          // いいね／ほしい！／おいしそう
const GUARD  = "<?php http_response_code(404); exit; ?>\n";
const LIMIT_SEC = 86400;                           // 同じ人・同じアイデア・同じスタンプは1日1回
const MAX_PER_HOUR = 120;                          // 1人あたりの上限（連打・機械的な投票の対策）

function fail($code, $msg) { http_response_code($code); echo json_encode(['ok' => false, 'error' => $msg]); exit; }
function store($name) { return __DIR__ . '/' . $name . '.data.php'; }
function load($fp) {
  rewind($fp); $raw = stream_get_contents($fp);
  $json = substr($raw, strlen(GUARD));
  $d = json_decode($json ?: '{}', true);
  return is_array($d) ? $d : [];
}
function save($fp, $d) {
  ftruncate($fp, 0); rewind($fp);
  fwrite($fp, GUARD . json_encode($d, JSON_UNESCAPED_UNICODE)); fflush($fp);
}
function open_locked($name) {
  $fp = fopen(store($name), 'c+'); if (!$fp) fail(500, 'storage');
  if (!flock($fp, LOCK_EX)) fail(500, 'lock');
  return $fp;
}

$set = $_REQUEST['set'] ?? '';
if (!isset(SETS[$set])) fail(400, 'set');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $fp = open_locked('counts-' . $set); $d = load($fp); flock($fp, LOCK_UN); fclose($fp);
  echo json_encode(['ok' => true, 'counts' => (object)$d]); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'method');

// 同じサイトからの送信だけ受け付ける
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !preg_match('#^https?://(www\.)?ichigo-saitama\.net$#', $origin) && !preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) fail(403, 'origin');

$id = (int)($_POST['id'] ?? 0);
$stamp = $_POST['stamp'] ?? '';
if ($id < 1 || $id > SETS[$set] || !in_array($stamp, STAMPS, true)) fail(400, 'param');

// 送信者の目印（IPはそのまま保存せず、ハッシュにする）
$who = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '') . '|ichigo-salt');
$now = time();

$lp = open_locked('limits-' . $set); $lim = load($lp);
foreach ($lim as $k => $t) { if ($now - (is_array($t) ? max($t) : $t) > LIMIT_SEC) unset($lim[$k]); } // 古い記録は消す
$key = $who . ':' . $id . ':' . $stamp;
$hourKey = $who . ':h';
$hits = array_values(array_filter($lim[$hourKey] ?? [], fn($t) => $now - $t < 3600));
if (isset($lim[$key])) { flock($lp, LOCK_UN); fclose($lp); fail(429, 'already'); }
if (count($hits) >= MAX_PER_HOUR) { flock($lp, LOCK_UN); fclose($lp); fail(429, 'too_many'); }
$lim[$key] = $now; $hits[] = $now; $lim[$hourKey] = $hits;
save($lp, $lim); flock($lp, LOCK_UN); fclose($lp);

$fp = open_locked('counts-' . $set); $d = load($fp);
$d[$id] = $d[$id] ?? [];
$d[$id][$stamp] = ($d[$id][$stamp] ?? 0) + 1;
save($fp, $d); flock($fp, LOCK_UN); fclose($fp);

echo json_encode(['ok' => true, 'id' => $id, 'counts' => $d[$id]]);
