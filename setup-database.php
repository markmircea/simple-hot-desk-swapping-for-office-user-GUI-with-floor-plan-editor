<?php
// Complete database setup - run this once to initialize everything

define('DB_PATH', __DIR__ . '/database/seatbooking.db');

echo "<!DOCTYPE html>
<html>
<head>
    <title>Database Setup</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Seat Booking Database Setup</h1>";

try {
    // Create database directory if it doesn't exist
    $dbDir = dirname(DB_PATH);
    if (!file_exists($dbDir)) {
        mkdir($dbDir, 0755, true);
        echo "<p class='success'>✓ Created database directory</p>";
    }

    // Delete existing database if requested
    if (isset($_GET['fresh']) && $_GET['fresh'] === 'true') {
        if (file_exists(DB_PATH)) {
            unlink(DB_PATH);
            echo "<p class='info'>ℹ Deleted existing database for fresh install</p>";
        }
    }

    // Connect to database
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✓ Connected to database</p>";

    // Create tables
    echo "<h2>Creating Tables...</h2>";

    // Users table
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo "<p class='success'>✓ Created users table</p>";

    // Seats table with full schema including width/height
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
    echo "<p class='success'>✓ Created seats table</p>";

    // Bookings table
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
    echo "<p class='success'>✓ Created bookings table</p>";

    // Check if we need to seed data
    $stmt = $db->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    
    if ($userCount == 0) {
        echo "<h2>Seeding Initial Data...</h2>";
        
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
        echo "<p class='success'>✓ Added " . count($users) . " default users</p>";
    }

    // Check if we need to seed seats
    $stmt = $db->query("SELECT COUNT(*) FROM seats");
    $seatCount = $stmt->fetchColumn();
    
    if ($seatCount == 0) {
        // Add seats
        $stmt = $db->prepare("INSERT INTO seats (id, seat_number, seat_type, x_position, y_position, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        // Add desk seats (42 desks in 7x6 grid)
        for ($i = 1; $i <= 42; $i++) {
            $row = floor(($i - 1) / 6);
            $col = ($i - 1) % 6;
            $stmt->execute([$i, "Desk $i", 'desk', $col, $row, 1, 1]);
        }
        echo "<p class='success'>✓ Added 42 desk seats</p>";
        
        // Add meeting rooms
        $roomData1 = json_encode(['name' => 'Meeting Room 1', 'width' => 2, 'height' => 2]);
        $stmt->execute(['M1', $roomData1, 'meeting_room', 7, 1, 2, 2]);
        
        $roomData2 = json_encode(['name' => 'Meeting Room 2', 'width' => 2, 'height' => 2]);
        $stmt->execute(['M2', $roomData2, 'meeting_room', 7, 4, 2, 2]);
        echo "<p class='success'>✓ Added 2 meeting rooms</p>";
    }

    // Display statistics
    echo "<h2>Database Statistics</h2>";
    
    $stmt = $db->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    echo "<p>Total users: $userCount</p>";
    
    $stmt = $db->query("SELECT COUNT(*) FROM seats WHERE seat_type='desk'");
    $deskCount = $stmt->fetchColumn();
    echo "<p>Total desks: $deskCount</p>";
    
    $stmt = $db->query("SELECT COUNT(*) FROM seats WHERE seat_type='meeting_room'");
    $roomCount = $stmt->fetchColumn();
    echo "<p>Total meeting rooms: $roomCount</p>";
    
    $stmt = $db->query("SELECT COUNT(*) FROM bookings");
    $bookingCount = $stmt->fetchColumn();
    echo "<p>Total bookings: $bookingCount</p>";

    echo "<hr>";
    echo "<h2>✅ Setup Complete!</h2>";
    echo "<p>Your database is ready to use.</p>";
    echo "<p><a href='index.html' class='btn'>Go to Application →</a></p>";
    echo "<br>";
    echo "<p><small>To completely reset the database, <a href='?fresh=true' onclick='return confirm(\"This will delete all data. Are you sure?\")'>click here for fresh install</a></small></p>";
    
} catch (Exception $e) {
    echo "<p class='error'>✗ Setup failed: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "</body></html>";
?>