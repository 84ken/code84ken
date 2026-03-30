<?php
/**
 * Photo upload/list API for 蒸気会議
 * GET  → list photos
 * POST → upload photo (multipart/form-data: file, name)
 */
header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . '/../data';
$uploadDir = __DIR__ . '/../uploads/photos';
$dataFile = $dataDir . '/photos.json';

// Ensure directories exist
if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

function loadData($file) {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?: [];
}

function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $photos = loadData($dataFile);
    // Sort newest first
    usort($photos, fn($a, $b) => ($b['ts'] ?? 0) <=> ($a['ts'] ?? 0));
    echo json_encode(['ok' => true, 'photos' => $photos]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['file'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
    $maxSize = 20 * 1024 * 1024; // 20MB

    if (!in_array($file['type'], $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed: jpg, png, webp, gif, heic']);
        exit;
    }

    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Max 20MB']);
        exit;
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $ext = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    $filename = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Upload failed']);
        exit;
    }

    $name = trim($_POST['name'] ?? '匿名');
    $caption = trim($_POST['caption'] ?? '');

    $photo = [
        'id' => bin2hex(random_bytes(8)),
        'filename' => $filename,
        'url' => '/uploads/photos/' . $filename,
        'name' => $name,
        'caption' => $caption,
        'ts' => time(),
    ];

    $photos = loadData($dataFile);
    $photos[] = $photo;
    saveData($dataFile, $photos);

    echo json_encode(['ok' => true, 'photo' => $photo]);
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
    $photos = loadData($dataFile);
    $photos = array_values(array_filter($photos, fn($p) => $p['id'] !== $id));
    saveData($dataFile, $photos);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
