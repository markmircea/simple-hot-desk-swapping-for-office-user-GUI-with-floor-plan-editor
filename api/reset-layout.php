<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$db = getDB();

try {
    // Start transaction
    $db->beginTransaction();
    
    // Clear existing seats
    $db->exec("DELETE FROM seats");
    
    // Check if width/height columns exist
    $stmt = $db->query("PRAGMA table_info(seats)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $hasWidthHeight = false;
    foreach ($columns as $column) {
        if ($column['name'] === 'width') {
            $hasWidthHeight = true;
            break;
        }
    }
    
    if ($hasWidthHeight) {
        // New schema with width/height
        $stmt = $db->prepare("INSERT INTO seats (id, seat_number, seat_type, x_position, y_position, width, height, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
        
        // Add default desk seats (42 desks in 7x6 grid)
        for ($i = 1; $i <= 42; $i++) {
            $row = floor(($i - 1) / 6);
            $col = ($i - 1) % 6;
            $stmt->execute([$i, "Desk $i", 'desk', $col, $row, 1, 1]);
        }
        
        // Add default meeting rooms
        $roomData1 = json_encode(['name' => 'Meeting Room 1', 'width' => 2, 'height' => 2]);
        $stmt->execute(['M1', $roomData1, 'meeting_room', 7, 1, 2, 2]);
        
        $roomData2 = json_encode(['name' => 'Meeting Room 2', 'width' => 2, 'height' => 2]);
        $stmt->execute(['M2', $roomData2, 'meeting_room', 7, 4, 2, 2]);
    } else {
        // Old schema without width/height
        $stmt = $db->prepare("INSERT INTO seats (id, seat_number, seat_type, x_position, y_position, is_available) VALUES (?, ?, ?, ?, ?, 1)");
        
        // Add default desk seats (42 desks in 7x6 grid)
        for ($i = 1; $i <= 42; $i++) {
            $row = floor(($i - 1) / 6);
            $col = ($i - 1) % 6;
            $stmt->execute([$i, "Desk $i", 'desk', $col, $row]);
        }
        
        // Add default meeting rooms
        $roomData1 = json_encode(['name' => 'Meeting Room 1', 'width' => 2, 'height' => 2]);
        $stmt->execute(['M1', $roomData1, 'meeting_room', 7, 1]);
        
        $roomData2 = json_encode(['name' => 'Meeting Room 2', 'width' => 2, 'height' => 2]);
        $stmt->execute(['M2', $roomData2, 'meeting_room', 7, 4]);
    }
    
    // Commit transaction
    $db->commit();
    
    echo json_encode(['success' => true, 'message' => 'Layout reset to default']);
    
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode(['success' => false, 'message' => 'Failed to reset layout: ' . $e->getMessage()]);
}
?>