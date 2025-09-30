<?php
header('Content-Type: application/json');

require_once 'db.php';

// GET support: ?limit=10
$limit = 10;
if (isset($_GET['limit'])) {
    $limitParam = filter_var($_GET['limit'], FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 100]
    ]);
    if ($limitParam !== false) {
        $limit = $limitParam;
    }
}

try {
    $stmt = $pdo->prepare('SELECT player, score, created_at FROM elvis_scores ORDER BY score DESC, created_at ASC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
} catch (Exception $e) {
    error_log('Database query error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal Server Error']);
}