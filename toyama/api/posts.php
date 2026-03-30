<?php
/**
 * Idea/Post API for 蒸気会議
 * GET  → list posts
 * POST → create post (JSON body: {name, text, category?})
 */
header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . '/../data';
$dataFile = $dataDir . '/posts.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);

function loadData($file) {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?: [];
}

function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $posts = loadData($dataFile);
    usort($posts, fn($a, $b) => ($b['ts'] ?? 0) <=> ($a['ts'] ?? 0));
    echo json_encode(['ok' => true, 'posts' => $posts]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = trim($input['name'] ?? '');
    $text = trim($input['text'] ?? '');
    $category = $input['category'] ?? 'idea';

    if (!$name || !$text) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and text required']);
        exit;
    }

    if (mb_strlen($text) > 2000) {
        http_response_code(400);
        echo json_encode(['error' => 'Text too long (max 2000 chars)']);
        exit;
    }

    $validCategories = ['idea', 'question', 'plan', 'memo'];
    if (!in_array($category, $validCategories)) $category = 'idea';

    $post = [
        'id' => bin2hex(random_bytes(8)),
        'name' => $name,
        'text' => $text,
        'category' => $category,
        'ts' => time(),
    ];

    $posts = loadData($dataFile);
    $posts[] = $post;
    saveData($dataFile, $posts);

    echo json_encode(['ok' => true, 'post' => $post]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'No id']);
        exit;
    }
    $posts = loadData($dataFile);
    $posts = array_values(array_filter($posts, fn($p) => $p['id'] !== $id));
    saveData($dataFile, $posts);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
