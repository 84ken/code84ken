<?php
/**
 * 口コミ掲示板 API v2
 * GET  /board-api.php              — 投稿一覧（ツリー形式）
 * POST /board-api.php              — 新規投稿（parent_id あり→返信）
 * POST /board-api.php?action=like  — いいねトグル（IP管理）
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$dataDir  = __DIR__ . '/data';
$dataFile = $dataDir . '/board-data.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);
if (!file_exists($dataFile)) file_put_contents($dataFile, json_encode([], JSON_UNESCAPED_UNICODE));

function loadPosts($dataFile) {
    return json_decode(file_get_contents($dataFile), true) ?: [];
}
function savePosts($dataFile, $posts) {
    file_put_contents($dataFile, json_encode($posts, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}
function getUserIp() {
    return md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

// ---- GET: 投稿一覧 ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $posts = loadPosts($dataFile);

    // カテゴリフィルター
    $cat = $_GET['category'] ?? 'all';
    if ($cat !== 'all') {
        $posts = array_values(array_filter($posts, fn($p) => ($p['category'] ?? '') === $cat));
    }

    // 親投稿だけ取り出し、新しい順にソート
    $parents = array_values(array_filter($posts, fn($p) => empty($p['parent_id'])));
    usort($parents, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

    // 全投稿からツリーを組み立てる（カテゴリフィルター前の全データで返信を探す）
    $allPosts = loadPosts($dataFile);
    $replyMap = [];
    foreach ($allPosts as $p) {
        if (!empty($p['parent_id'])) {
            $replyMap[$p['parent_id']][] = $p;
        }
    }
    // 各親に replies をセット
    foreach ($parents as &$parent) {
        $replies = $replyMap[$parent['id']] ?? [];
        usort($replies, fn($a, $b) => strtotime($a['created_at']) - strtotime($b['created_at']));
        $parent['replies'] = $replies;
    }
    unset($parent);

    echo json_encode(['posts' => $parents], JSON_UNESCAPED_UNICODE);
    exit;
}

// ---- POST: いいねトグル ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_GET['action'] ?? '') === 'like') {
    $input = json_decode(file_get_contents('php://input'), true);
    $postId = $input['id'] ?? '';
    if (!$postId) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }

    $userIp = getUserIp();
    $posts = loadPosts($dataFile);
    $found = false;
    foreach ($posts as &$p) {
        if ($p['id'] === $postId) {
            $p['likes'] = $p['likes'] ?? [];
            if (in_array($userIp, $p['likes'])) {
                $p['likes'] = array_values(array_filter($p['likes'], fn($x) => $x !== $userIp));
                $liked = false;
            } else {
                $p['likes'][] = $userIp;
                $liked = true;
            }
            $count = count($p['likes']);
            $found = true;
            break;
        }
    }
    unset($p);
    if (!$found) { http_response_code(404); echo json_encode(['error' => 'not found']); exit; }
    savePosts($dataFile, $posts);
    echo json_encode(['liked' => $liked, 'count' => $count], JSON_UNESCAPED_UNICODE);
    exit;
}

// ---- POST: 新規投稿 / 返信 ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['body']) || mb_strlen(trim($input['body'])) === 0) {
        http_response_code(400);
        echo json_encode(['error' => '本文を入力してください'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (mb_strlen($input['body']) > 1000) {
        http_response_code(400);
        echo json_encode(['error' => '本文は1000文字以内にしてください'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $allowedCategories = ['やりたいこと', 'お悩み', '情報共有', 'その他'];
    $category  = in_array($input['category'] ?? '', $allowedCategories) ? $input['category'] : 'その他';
    $nickname  = trim($input['nickname'] ?? '');
    $nickname  = mb_strlen($nickname) > 0 ? mb_substr(htmlspecialchars($nickname, ENT_QUOTES, 'UTF-8'), 0, 20) : '匿名さん';
    $body      = mb_substr(htmlspecialchars(trim($input['body']), ENT_QUOTES, 'UTF-8'), 0, 1000);
    $parentId  = !empty($input['parent_id']) ? preg_replace('/[^a-z0-9_]/', '', $input['parent_id']) : null;

    $post = [
        'id'         => uniqid('post_'),
        'parent_id'  => $parentId,
        'nickname'   => $nickname,
        'category'   => $category,
        'body'       => $body,
        'likes'      => [],
        'created_at' => date('Y-m-d H:i:s'),
    ];

    $posts = loadPosts($dataFile);
    $posts[] = $post;
    if (count($posts) > 1000) {
        usort($posts, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));
        $posts = array_slice($posts, 0, 1000);
    }
    savePosts($dataFile, $posts);

    echo json_encode(['success' => true, 'post' => $post], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
