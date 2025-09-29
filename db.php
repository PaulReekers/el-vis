<?php
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = parse_ini_file(__DIR__ . '/.env');
    $servername = $dotenv['DB_SERVERNAME'];
    $username = $dotenv['DB_USERNAME'];
    $password = $dotenv['DB_PASSWORD'];
    $dbname = $dotenv['DB_NAME'];

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password, $options);
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal Server Error']);
        exit();
    }
} else {
    error_log('Environment file not found');
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error']);
    exit();
}
