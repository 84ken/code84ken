<?php
/**
 * 口コミ掲示板 API
 * GET:  投稿一覧を取得（JSON）
 * POST: 新規投稿を追加
 */

header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/board-data.json';

// データディレクトリがなければ作成
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// データファイルがなければ空配列で初期化
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([], JSON_UNESCAPED_UNICODE));
}

// GET: 投稿一覧を返す
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $posts = json_decode(file_get_contents($dataFile), true) ?: [];
    // 新しい順にソート
    usort($posts, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    // カテゴリフィルター
    if (!empty($_GET['category']) && $_GET['category'] !== 'all') {
        $cat = $_GET['category'];
        $posts = array_values(array_filter($posts, function($p) use ($cat) {
            return $p['category'] === $cat;
        }));
    }

    echo json_encode(['posts' => $posts], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST: 新規投稿
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // バリデーション
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
    $category = in_array($input['category'] ?? '', $allowedCategories) ? $input['category'] : 'その他';

    // サニタイズ
    $nickname = trim($input['nickname'] ?? '');
    $nickname = mb_strlen($nickname) > 0 ? mb_substr(htmlspecialchars($nickname, ENT_QUOTES, 'UTF-8'), 0, 20) : '匿名さん';
    $body = mb_substr(htmlspecialchars(trim($input['body']), ENT_QUOTES, 'UTF-8'), 0, 1000);

    // 投稿データ作成
    $post = [
        'id' => uniqid('post_'),
        'nickname' => $nickname,
        'category' => $category,
        'body' => $body,
        'created_at' => date('Y-m-d H:i:s')
    ];

    // 保存
    $posts = json_decode(file_get_contents($dataFile), true) ?: [];
    $posts[] = $post;

    // 最大500件に制限（古い投稿を削除）
    if (count($posts) > 500) {
        usort($posts, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        $posts = array_slice($posts, 0, 500);
    }

    file_put_contents($dataFile, json_encode($posts, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode(['success' => true, 'post' => $post], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
