<?php
/**
 * うちのこゲームミュージアム API
 * GET  /album-api.php                        — 全ゲームの いいね数・コメント一覧
 * POST /album-api.php?action=like            — いいねトグル（IPハッシュ管理） {game}
 * POST /album-api.php                        — コメント投稿 {game, nickname, body}
 * POST /album-api.php?action=delete_comment  — コメント削除（管理用） {game, id, token}
 */

date_default_timezone_set('Asia/Tokyo');
header('Content-Type: application/json; charset=utf-8');

define('ADMIN_TOKEN', 'kuma-hana-kotaro-2026');

$dataDir  = __DIR__ . '/data';
$dataFile = $dataDir . '/album-data.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);
if (!file_exists($dataFile)) file_put_contents($dataFile, json_encode(new stdClass(), JSON_UNESCAPED_UNICODE));

function loadData($f) { return json_decode(file_get_contents($f), true) ?: []; }
function saveData($f, $d) { file_put_contents($f, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX); }
function userHash() { return md5(($_SERVER['REMOTE_ADDR'] ?? 'unknown') . 'childgame-salt'); }
function cleanGameKey($s) { return preg_replace('/[^a-zA-Z0-9._-]/', '', $s ?? ''); }
function entry(&$data, $game) {
    if (!isset($data[$game])) $data[$game] = ['likes' => [], 'comments' => []];
    return $data[$game];
}

// ---- GET: 全データ ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = loadData($dataFile);
    $me = userHash();
    $out = [];
    foreach ($data as $game => $e) {
        $out[$game] = [
            'likes'     => count($e['likes'] ?? []),
            'likedByMe' => in_array($me, $e['likes'] ?? []),
            'comments'  => array_values($e['comments'] ?? []),
        ];
    }
    echo json_encode(['games' => $out ?: new stdClass()], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$game = cleanGameKey($input['game'] ?? '');
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$game) {
    http_response_code(400); echo json_encode(['error' => 'game required']); exit;
}

// ---- POST: いいねトグル ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_GET['action'] ?? '') === 'like') {
    $data = loadData($dataFile);
    entry($data, $game);
    $me = userHash();
    $likes = $data[$game]['likes'];
    if (in_array($me, $likes)) {
        $data[$game]['likes'] = array_values(array_filter($likes, fn($x) => $x !== $me));
        $liked = false;
    } else {
        $data[$game]['likes'][] = $me;
        $liked = true;
    }
    saveData($dataFile, $data);
    echo json_encode(['liked' => $liked, 'count' => count($data[$game]['likes'])]);
    exit;
}

// ---- POST: コメント削除（管理用） ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_GET['action'] ?? '') === 'delete_comment') {
    if (($input['token'] ?? '') !== ADMIN_TOKEN) {
        http_response_code(403); echo json_encode(['error' => 'forbidden']); exit;
    }
    $data = loadData($dataFile);
    entry($data, $game);
    $id = $input['id'] ?? '';
    $before = count($data[$game]['comments']);
    $data[$game]['comments'] = array_values(array_filter(
        $data[$game]['comments'], fn($c) => $c['id'] !== $id));
    saveData($dataFile, $data);
    echo json_encode(['deleted' => $before - count($data[$game]['comments'])]);
    exit;
}

// ---- POST: コメント投稿 ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = trim($input['body'] ?? '');
    if ($body === '') {
        http_response_code(400);
        echo json_encode(['error' => 'メッセージをかいてね'], JSON_UNESCAPED_UNICODE); exit;
    }
    if (mb_strlen($body) > 300) {
        http_response_code(400);
        echo json_encode(['error' => 'メッセージは300文字までだよ'], JSON_UNESCAPED_UNICODE); exit;
    }
    // 表示時にクライアント側でエスケープするため、ここでは生テキストのまま保存
    $nickname = trim($input['nickname'] ?? '');
    $nickname = mb_strlen($nickname) > 0 ? mb_substr($nickname, 0, 20) : 'だれかさん';

    $comment = [
        'id'         => uniqid('c_'),
        'nickname'   => $nickname,
        'body'       => mb_substr($body, 0, 300),
        'created_at' => date('Y-m-d H:i:s'),
    ];

    $data = loadData($dataFile);
    entry($data, $game);
    $data[$game]['comments'][] = $comment;
    if (count($data[$game]['comments']) > 300) {
        $data[$game]['comments'] = array_slice($data[$game]['comments'], -300);
    }
    saveData($dataFile, $data);
    echo json_encode(['success' => true, 'comment' => $comment], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
