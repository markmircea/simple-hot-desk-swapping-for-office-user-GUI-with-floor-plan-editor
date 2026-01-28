<?php
require_once 'config.php';

$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get all users
        $stmt = $db->query("SELECT id, name, email, is_admin FROM users ORDER BY name");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'users' => $users
        ]);
        break;
        
    case 'POST':
        // Add new user
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Name is required'
            ]);
            exit;
        }
        
        $stmt = $db->prepare("INSERT INTO users (name, email, is_admin) VALUES (?, ?, ?)");
        
        try {
            $stmt->execute([
                $data['name'],
                $data['email'] ?? null,
                $data['is_admin'] ?? 0
            ]);
            
            echo json_encode([
                'success' => true,
                'user_id' => $db->lastInsertId(),
                'message' => 'User added successfully'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to add user'
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