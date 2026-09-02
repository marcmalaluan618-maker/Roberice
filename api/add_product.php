<?php
header("Content-Type: application/json");
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        INSERT INTO product
        (product_name, category, description, price_sack, price_kg, kg_per_sack, product_status)
        VALUES (?, ?, '', ?, ?, ?, 'Active')
    ");

    $stmt->execute([
        $data['name'],
        $data['category'],
        $data['priceSack'],
        $data['priceKg'],
        $data['kgPerSack']
    ]);

    $productId = $conn->lastInsertId();

    $stmt = $conn->prepare("
        INSERT INTO inventory
        (product_id, stock_sacks, stock_kg, reorder_level_kg)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([
        $productId,
        $data['initialSacks'],
        $data['initialKg'],
        $data['thresholdKg']
    ]);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Product added successfully."
    ]);

} catch (Exception $e) {
    $conn->rollBack();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>