<?php
/**
 * vendor-memo 保存エンドポイント（ConoHa WING）
 *
 * GET  : vendor-memos-live.json を返す（なければ404）
 * POST : X-Memo-Token ヘッダーをSHA-256で照合し、JSONを保存
 *
 * トークンの平文はリポジトリに置かない（ハッシュのみ）。
 * 保存先 vendor-memos-live.json は deploy-hq.yml の rsync --exclude 対象。
 */

$TOKEN_HASH = '8a857977318adeaaca324da6f1f7630ab356a0bd6b9edca30919cc3d05763a4a';
$file = __DIR__ . '/vendor-memos-live.json';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tok = isset($_SERVER['HTTP_X_MEMO_TOKEN']) ? $_SERVER['HTTP_X_MEMO_TOKEN'] : '';
    if (hash('sha256', $tok) !== $TOKEN_HASH) {
        http_response_code(403);
        echo '{"error":"forbidden"}';
        exit;
    }
    $body = file_get_contents('php://input');
    if (strlen($body) > 5000000) {
        http_response_code(413);
        echo '{"error":"too large"}';
        exit;
    }
    $j = json_decode($body, true);
    if (!is_array($j) || !isset($j['projects']) || !is_array($j['projects'])) {
        http_response_code(400);
        echo '{"error":"bad json"}';
        exit;
    }
    // 直前版を1世代バックアップ
    if (file_exists($file)) {
        @copy($file, $file . '.bak');
    }
    if (file_put_contents($file, $body, LOCK_EX) === false) {
        http_response_code(500);
        echo '{"error":"write failed"}';
        exit;
    }
    echo '{"ok":true,"savedAt":"' . date('c') . '"}';
} else {
    if (file_exists($file)) {
        readfile($file);
    } else {
        http_response_code(404);
        echo '{"error":"no live data yet"}';
    }
}
