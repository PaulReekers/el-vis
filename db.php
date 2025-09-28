<?php
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = parse_ini_file(__DIR__ . '/.env');
    $servername = $dotenv['DB_SERVERNAME'];
    $username = $dotenv['DB_USERNAME'];
    $password = $dotenv['DB_PASSWORD'];
    $dbname = $dotenv['DB_NAME'];

    try {
        $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal Server Error']);
        exit();
    }
} else {
    error_log('Environment file not found');
    $_SESSION['error_message'] = 'Oeps, er is iets mis gegaan. Probeer het later opnieuw.';
    //header("Location: /wedstock/error");
    exit();
}
