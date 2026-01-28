<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$db = getDB();
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

try {
    // Start transaction
    $db->beginTransaction();
    
    // First, delete all bookings for this user
    $stmt = $db->prepare("DELETE FROM bookings WHERE user_id = ?");
    $stmt->execute([$data['user_id']]);
    
    // Then delete the user
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$data['user_id']]);
    
    if ($stmt->rowCount() > 0) {
        $db->commit();
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()]);
}
?>