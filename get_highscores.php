<?php
header('Content-Type: application/json');

require_once 'db.php';

// GET support: ?limit=10
$limit = isset($_GET['limit']) ? min(100, (int)$_GET['limit']) : 10;

try {
  $stmt = $pdo->prepare('SELECT player, score, created_at FROM elvis_scores ORDER BY score DESC, created_at ASC LIMIT :limit');
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll();
  echo json_encode($rows);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Query failed']);
}
