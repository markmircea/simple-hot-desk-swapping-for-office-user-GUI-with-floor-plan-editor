<?php
// Database configuration
define('DB_PATH', __DIR__ . '/../database/seatbooking.db');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
function getDB() {
    try {
        $db = new PDO('sqlite:' . DB_PATH);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db;
    } catch (PDOException $e) {
        die(json_encode(['success' => false, 'message' => 'Database connection failed']));
    }
}

// Initialize database if it doesn't exist
function initDatabase() {
    $db = getDB();
    
    // Create users table
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Create seats table (updated to store dynamic layouts)
    $db->exec("CREATE TABLE IF NOT EXISTS seats (
        id TEXT PRIMARY KEY,
        seat_number TEXT,
        seat_type TEXT DEFAULT 'desk',
        x_position INTEGER,
        y_position INTEGER,
        width INTEGER DEFAULT 1,
        height INTEGER DEFAULT 1,
        is_available INTEGER DEFAULT 1
    )");
    
    // Create bookings table
    $db->exec("CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        seat_id TEXT,
        booking_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(seat_id, booking_date),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (seat_id) REFERENCES seats(id)
    )");
    
    // Check if we need to seed data
    $stmt = $db->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    
    if ($userCount == 0) {
        seedDatabase($db);
    }
}

// Seed initial data
function seedDatabase($db) {
    // Add default users
    $users = [
        ['John Doe', 'john.doe@company.com', 1],
        ['Jane Smith', 'jane.smith@company.com', 0],
        ['Bob Johnson', 'bob.johnson@company.com', 0],
        ['Alice Williams', 'alice.williams@company.com', 0],
        ['Charlie Brown', 'charlie.brown@company.com', 0],
        ['Diana Prince', 'diana.prince@company.com', 0],
        ['Edward Norton', 'edward.norton@company.com', 0],
        ['Fiona Green', 'fiona.green@company.com', 0],
        ['George Harris', 'george.harris@company.com', 0],
        ['Helen Clark', 'helen.clark@company.com', 0]
    ];
    
    $stmt = $db->prepare("INSERT INTO users (name, email, is_admin) VALUES (?, ?, ?)");
    foreach ($users as $user) {
        $stmt->execute($user);
    }
    
    // Add seats
    $stmt = $db->prepare("INSERT INTO seats (id, seat_number, seat_type, x_position, y_position, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    // Add desk seats
    for ($i = 1; $i <= 42; $i++) {
        $row = floor(($i - 1) / 6);
        $col = ($i - 1) % 6;
        $stmt->execute([$i, "Desk $i", 'desk', $col, $row, 1, 1]);
    }
    
    // Add meeting rooms (store room data as JSON in seat_number)
    $roomData1 = json_encode(['name' => 'Meeting Room 1', 'width' => 2, 'height' => 2]);
    $stmt->execute(['M1', $roomData1, 'meeting_room', 7, 1, 2, 2]);
    
    $roomData2 = json_encode(['name' => 'Meeting Room 2', 'width' => 2, 'height' => 2]);
    $stmt->execute(['M2', $roomData2, 'meeting_room', 7, 4, 2, 2]);
}

// Initialize database on first run
initDatabase();
?>