<?php
require_once 'config.php';

$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get bookings for a specific date
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $stmt = $db->prepare("SELECT b.*, u.name as user_name 
                             FROM bookings b 
                             LEFT JOIN users u ON b.user_id = u.id 
                             WHERE b.booking_date = ?");
        $stmt->execute([$date]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'date' => $date,
            'bookings' => $bookings
        ]);
        break;
        
    case 'POST':
        // Create new booking
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['seat_id']) || empty($data['user_id']) || empty($data['date'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields'
            ]);
            exit;
        }
        
        // Check if seat is already booked
        $stmt = $db->prepare("SELECT id FROM bookings WHERE seat_id = ? AND booking_date = ?");
        $stmt->execute([$data['seat_id'], $data['date']]);
        
        if ($stmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'This seat is already booked for the selected date'
            ]);
            exit;
        }
        
        // Create booking
        $stmt = $db->prepare("INSERT INTO bookings (user_id, user_name, seat_id, booking_date) VALUES (?, ?, ?, ?)");
        
        try {
            $stmt->execute([
                $data['user_id'],
                $data['user_name'] ?? '',
                $data['seat_id'],
                $data['date']
            ]);
            
            echo json_encode([
                'success' => true,
                'booking_id' => $db->lastInsertId(),
                'message' => 'Booking created successfully'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create booking'
            ]);
        }
        break;
        
    case 'DELETE':
        // Cancel booking
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['seat_id']) || empty($data['date'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields'
            ]);
            exit;
        }
        
        $stmt = $db->prepare("DELETE FROM bookings WHERE seat_id = ? AND booking_date = ?");
        
        try {
            $stmt->execute([$data['seat_id'], $data['date']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Booking cancelled successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No booking found to cancel'
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to cancel booking'
            ]);
        }
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
}
?>