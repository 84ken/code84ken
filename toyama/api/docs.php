<?php
/**
 * Document upload/list API for 蒸気会議
 * GET  → list documents
 * POST → upload document (multipart/form-data: file, name, description?)
 */
header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . '/../data';
$uploadDir = __DIR__ . '/../uploads/docs';
$dataFile = $dataDir . '/docs.json';

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
    $docs = loadData($dataFile);
    usort($docs, fn($a, $b) => ($b['ts'] ?? 0) <=> ($a['ts'] ?? 0));
    echo json_encode(['ok' => true, 'docs' => $docs]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['file'];
    $allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];
    $maxSize = 50 * 1024 * 1024; // 50MB

    if (!in_array($file['type'], $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'File type not allowed. Allowed: pdf, docx, xlsx, pptx, txt, csv, images']);
        exit;
    }

    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Max 50MB']);
        exit;
    }

    $origName = basename($file['name']);
    $ext = pathinfo($origName, PATHINFO_EXTENSION) ?: 'bin';
    $ext = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    $filename = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Upload failed']);
        exit;
    }

    $name = trim($_POST['name'] ?? '匿名');
    $description = trim($_POST['description'] ?? '');

    $doc = [
        'id' => bin2hex(random_bytes(8)),
        'filename' => $filename,
        'originalName' => $origName,
        'url' => '/uploads/docs/' . $filename,
        'name' => $name,
        'description' => $description,
        'size' => $file['size'],
        'type' => $file['type'],
        'ts' => time(),
    ];

    $docs = loadData($dataFile);
    $docs[] = $doc;
    saveData($dataFile, $docs);

    echo json_encode(['ok' => true, 'doc' => $doc]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
