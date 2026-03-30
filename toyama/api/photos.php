<?php
/**
 * Photo upload/list/delete API for Hive Tour
 * GET    → list photos
 * POST   → upload photo (multipart/form-data: file, name, caption?)
 * DELETE → delete photo (JSON body: {id})
 */
header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . '/../data';
$uploadDir = __DIR__ . '/../photos';
$dataFile = $dataDir . '/photos.json';

// Ensure directories exist
if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

function loadData($file) {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?: [];
}

function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

// Allowed extensions (check by extension, not MIME — more reliable on mobile)
$allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $photos = loadData($dataFile);
    usort($photos, fn($a, $b) => ($b['ts'] ?? 0) <=> ($a['ts'] ?? 0));
    echo json_encode(['ok' => true, 'photos' => $photos]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errCode = $_FILES['file']['error'] ?? -1;
        $errMap = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server limit',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form limit',
            UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Server temp dir missing',
            UPLOAD_ERR_CANT_WRITE => 'Server cannot write file',
        ];
        http_response_code(400);
        echo json_encode(['error' => $errMap[$errCode] ?? 'Upload error: ' . $errCode]);
        exit;
    }

    $file = $_FILES['file'];
    $maxSize = 20 * 1024 * 1024; // 20MB

    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Max 20MB']);
        exit;
    }

    // Check extension
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: '');
    if (!in_array($ext, $allowedExt)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type (' . $ext . '). Allowed: ' . implode(', ', $allowedExt)]);
        exit;
    }

    // Double-check with getimagesize (works for most image types)
    $imgInfo = @getimagesize($file['tmp_name']);
    if ($imgInfo === false && !in_array($ext, ['heic', 'heif', 'avif'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File does not appear to be a valid image']);
        exit;
    }

    $filename = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Upload failed. Check directory permissions.']);
        exit;
    }

    $name = trim($_POST['name'] ?? '匿名');
    $caption = trim($_POST['caption'] ?? '');

    $photo = [
        'id' => bin2hex(random_bytes(8)),
        'filename' => $filename,
        'url' => '/photos/' . $filename,
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
    $toDelete = null;
    $remaining = [];
    foreach ($photos as $p) {
        if ($p['id'] === $id) {
            $toDelete = $p;
        } else {
            $remaining[] = $p;
        }
    }

    // Delete actual file
    if ($toDelete && !empty($toDelete['filename'])) {
        $filePath = $uploadDir . '/' . basename($toDelete['filename']);
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }

    saveData($dataFile, $remaining);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
