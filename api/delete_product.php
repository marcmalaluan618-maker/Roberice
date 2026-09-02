<?php
header("Content-Type: application/json");
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['productId'])) {
    echo json_encode([
        "success" => false,
        "message" => "Product ID is required."
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        UPDATE product
        SET product_status = 'Inactive'
        WHERE product_id = ?
    ");

    $stmt->execute([$data['productId']]);

    echo json_encode([
        "success" => true
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>