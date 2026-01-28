<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$db = getDB();
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['seats']) || !isset($data['meeting_rooms'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Labels are optional
$labels = isset($data['labels']) ? $data['labels'] : [];

try {
    // Start transaction
    $db->beginTransaction();
    
    // Clear existing seats
    $db->exec("DELETE FROM seats");
    
    // Check if width and height columns exist
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
        // New schema with width/height columns
        $stmt = $db->prepare("INSERT INTO seats (id, seat_number, seat_type, x_position, y_position, width, height, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
        
        // Add desk seats
        foreach ($data['seats'] as $seat) {
            $stmt->execute([
                $seat['id'],
                "Desk " . $seat['id'],
                'desk',
                $seat['x_position'],
                $seat['y_position'],
                1,
                1
            ]);
        }
        
        // Add meeting rooms
        foreach ($data['meeting_rooms'] as $room) {
            $roomData = json_encode([
                'name' => $room['name'],
                'width' => $room['width'] ?? 2,
                'height' => $room['height'] ?? 2
            ]);
            
            $stmt->execute([
                $room['id'],
                $roomData,
                'meeting_room',
                $room['x_position'],
                $room['y_position'],
                $room['width'] ?? 2,
                $room['height'] ?? 2
            ]);
        }
        
        // Add area labels
        foreach ($labels as $label) {
            $stmt->execute([
                $label['id'],
                $label['text'],
                'label',
                $label['x_position'],
                $label['y_position'],
                1,
                1
            ]);
        }
    } else {
        // Old schema without width/height columns
        $stmt = $db->prepare("INSERT INTO seats (id, seat_number, seat_type, x_position, y_position, is_available) VALUES (?, ?, ?, ?, ?, 1)");
        
        // Add desk seats
        foreach ($data['seats'] as $seat) {
            $stmt->execute([
                $seat['id'],
                "Desk " . $seat['id'],
                'desk',
                $seat['x_position'],
                $seat['y_position']
            ]);
        }
        
        // Add meeting rooms
        foreach ($data['meeting_rooms'] as $room) {
            $roomData = json_encode([
                'name' => $room['name'],
                'width' => $room['width'] ?? 2,
                'height' => $room['height'] ?? 2
            ]);
            
            $stmt->execute([
                $room['id'],
                $roomData,
                'meeting_room',
                $room['x_position'],
                $room['y_position']
            ]);
        }
        
        // Add area labels
        foreach ($labels as $label) {
            $stmt->execute([
                $label['id'],
                $label['text'],
                'label',
                $label['x_position'],
                $label['y_position']
            ]);
        }
    }
    
    // Commit transaction
    $db->commit();
    
    echo json_encode(['success' => true, 'message' => 'Layout saved successfully']);
    
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode(['success' => false, 'message' => 'Failed to save layout: ' . $e->getMessage()]);
}
?>