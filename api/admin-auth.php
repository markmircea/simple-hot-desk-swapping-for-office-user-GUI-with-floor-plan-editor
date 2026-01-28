<?php
require_once 'config.php';

// Admin credentials (in production, use hashed passwords)
define('ADMIN_PASSWORD', 'tpgcluj');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Password is required']);
    exit;
}

// Check password
if ($data['password'] === ADMIN_PASSWORD) {
    // In production, you would generate a secure session token here
    echo json_encode([
        'success' => true,
        'message' => 'Authentication successful',
        'token' => base64_encode('admin_' . time()) // Simple token for demo
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid password'
    ]);
}
?>