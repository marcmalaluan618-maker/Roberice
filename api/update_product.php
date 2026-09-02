<?php
header("Content-Type: application/json");
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

try {
    $stmt = $conn->prepare("
        UPDATE product
        SET product_name = ?, category = ?, price_sack = ?, price_kg = ?, kg_per_sack = ?
        WHERE product_id = ?
    ");

    $stmt->execute([
        $data['name'],
        $data['category'],
        $data['priceSack'],
        $data['priceKg'],
        $data['kgPerSack'],
        $data['productId']
    ]);

    $stmt = $conn->prepare("
        UPDATE inventory
        SET reorder_level_kg = ?
        WHERE product_id = ?
    ");

    $stmt->execute([
        $data['thresholdKg'],
        $data['productId']
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Product updated successfully."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>