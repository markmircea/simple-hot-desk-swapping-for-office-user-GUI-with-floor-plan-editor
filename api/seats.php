<?php
require_once 'config.php';

$db = getDB();

// Get all seats
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("SELECT * FROM seats ORDER BY id");
    $seats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process meeting rooms to extract name and dimensions
    foreach ($seats as &$seat) {
        if ($seat['seat_type'] === 'meeting_room') {
            $roomData = json_decode($seat['seat_number'], true);
            if ($roomData) {
                $seat['seat_number'] = $roomData['name'] ?? 'Meeting Room';
                $seat['width'] = $roomData['width'] ?? 2;
                $seat['height'] = $roomData['height'] ?? 2;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'seats' => $seats
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
?>