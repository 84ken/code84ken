<?php
/**
 * Slack API Proxy for 蒸気会議 Live Updates
 *
 * Fetches messages from #healthian-wood-hive-tour channel
 * and returns formatted JSON for the frontend.
 *
 * Config: ../slack-config.php (excluded from git/deploy)
 *   <?php
 *   define('SLACK_BOT_TOKEN', 'xoxb-...');
 *   define('SLACK_CHANNEL_ID', 'C0AFA11C8H3');
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120');

// Load config (stored on server, not in repo)
$configPath = __DIR__ . '/../slack-config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['error' => 'Config not found', 'messages' => []]);
    exit;
}
require_once $configPath;

if (!defined('SLACK_BOT_TOKEN') || !defined('SLACK_CHANNEL_ID')) {
    http_response_code(503);
    echo json_encode(['error' => 'Config incomplete', 'messages' => []]);
    exit;
}

// Fetch channel history
$limit = min((int)($_GET['limit'] ?? 30), 50);

$url = 'https://slack.com/api/conversations.history?' . http_build_query([
    'channel' => SLACK_CHANNEL_ID,
    'limit'   => $limit,
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . SLACK_BOT_TOKEN,
        'Content-Type: application/json; charset=utf-8',
    ],
    CURLOPT_TIMEOUT        => 10,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    http_response_code(502);
    echo json_encode(['error' => 'Slack API error', 'messages' => []]);
    exit;
}

$data = json_decode($response, true);

if (!($data['ok'] ?? false)) {
    http_response_code(502);
    echo json_encode(['error' => $data['error'] ?? 'Unknown error', 'messages' => []]);
    exit;
}

// Fetch user info for display names (cached in session/file)
$cacheFile = sys_get_temp_dir() . '/slack_users_cache.json';
$usersCache = [];
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < 3600) {
    $usersCache = json_decode(file_get_contents($cacheFile), true) ?: [];
}

function getSlackUser($userId) {
    global $usersCache, $cacheFile;

    if (isset($usersCache[$userId])) {
        return $usersCache[$userId];
    }

    $url = 'https://slack.com/api/users.info?' . http_build_query(['user' => $userId]);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . SLACK_BOT_TOKEN,
        ],
        CURLOPT_TIMEOUT        => 5,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);

    $userData = json_decode($res, true);
    $name = 'Unknown';
    if (($userData['ok'] ?? false) && isset($userData['user'])) {
        $u = $userData['user'];
        $name = $u['profile']['display_name']
             ?: $u['profile']['real_name']
             ?: $u['name']
             ?: 'Unknown';
    }

    $usersCache[$userId] = $name;
    file_put_contents($cacheFile, json_encode($usersCache));

    return $name;
}

// Format messages
$messages = [];
foreach ($data['messages'] as $msg) {
    // Skip bot messages, channel joins, etc.
    if (isset($msg['subtype']) && !in_array($msg['subtype'], ['file_share'])) {
        continue;
    }

    $user = getSlackUser($msg['user'] ?? '');
    $ts = date('c', (int)floatval($msg['ts']));

    // Extract reactions
    $reactions = [];
    if (isset($msg['reactions'])) {
        foreach ($msg['reactions'] as $r) {
            // Convert Slack emoji name to emoji character where possible
            $emojiMap = [
                '+1' => '👍', 'thumbsup' => '👍',
                'heart' => '❤️', 'laughing' => '😆', 'smile' => '😄',
                'fire' => '🔥', 'eyes' => '👀', 'raised_hands' => '🙌',
                'clap' => '👏', '100' => '💯', 'tada' => '🎉',
                'pray' => '🙏', 'muscle' => '💪', 'hot_springs' => '♨️',
            ];
            $emoji = $emojiMap[$r['name']] ?? ':' . $r['name'] . ':';
            $reactions[] = ['name' => $emoji, 'count' => $r['count']];
        }
    }

    // Extract first image if any
    $image = null;
    if (isset($msg['files'])) {
        foreach ($msg['files'] as $file) {
            if (strpos($file['mimetype'] ?? '', 'image/') === 0) {
                // Use thumb_480 for reasonable size, fallback to permalink_public
                $image = $file['thumb_480'] ?? $file['permalink_public'] ?? null;
                break;
            }
        }
    }

    $messages[] = [
        'user' => $user,
        'text' => $msg['text'] ?? '',
        'ts'   => $ts,
        'reactions' => $reactions,
        'image' => $image,
    ];
}

echo json_encode([
    'ok'       => true,
    'messages' => $messages,
    'fetched'  => date('c'),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
