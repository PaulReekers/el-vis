<?php
header('Content-Type: application/json');
require_once 'db.php';

// Alleen POST toestaan
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$player = isset($data['player']) ? trim($data['player']) : null;

if (!isset($data['score']) || !is_numeric($data['score'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid score']);
  exit;
}
$score  = (int)$data['score'];

if (!$player || $score === null) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing player or score']);
  exit;
}

if (strlen($player) > 10) {
  http_response_code(400);
  echo json_encode(['error' => 'Player name too long']);
  exit;
}

try {
  $stmt = $pdo->prepare('INSERT INTO elvis_scores (player, score) VALUES (:player, :score)');
  $stmt->execute(['player' => $player, 'score' => $score]);
  echo json_encode(['success' => true]);
  exit;
} catch (Exception $e) {
  error_log("Database insert error: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Internal Server Error']);
  exit;
}
