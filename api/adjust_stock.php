<?php
header("Content-Type: application/json");
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['productId'], $data['type'])) {
    echo json_encode(["success" => false, "message" => "Missing required information."]);
    exit;
}

$productId = (int)$data['productId'];
$type = $data['type'];
$sacks = (int)($data['sacks'] ?? 0);
$kg = (float)($data['kg'] ?? 0);
$note = trim($data['note'] ?? '');
$user = trim($data['user'] ?? 'Admin User');

if (!in_array($type, ['restock', 'spoilage', 'correction'])) {
    echo json_encode(["success" => false, "message" => "Invalid adjustment type."]);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT
            i.stock_sacks,
            i.stock_kg,
            i.reorder_level_kg,
            p.product_name,
            p.kg_per_sack
        FROM inventory i
        JOIN product p ON i.product_id = p.product_id
        WHERE i.product_id = ?
        FOR UPDATE
    ");
    $stmt->execute([$productId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        throw new Exception("Inventory record not found.");
    }

    $newSacks = (int)$product['stock_sacks'];
    $newKg = (float)$product['stock_kg'];

    if ($type === 'restock') {
        $newSacks += abs($sacks);
        $newKg += abs($kg);
    } elseif ($type === 'spoilage') {
        $newSacks = max(0, $newSacks - abs($sacks));
        $newKg = max(0, $newKg - abs($kg));
    } else {
        $newSacks = max(0, $sacks);
        $newKg = max(0, $kg);
    }

    $stmt = $conn->prepare("
        UPDATE inventory
        SET stock_sacks = ?, stock_kg = ?
        WHERE product_id = ?
    ");
    $stmt->execute([$newSacks, $newKg, $productId]);

    $stmt = $conn->prepare("
        INSERT INTO inventory_adjustment
        (product_id, adjustment_type, sacks, kg, note, performed_by)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $productId,
        $type,
        abs($sacks),
        abs($kg),
        $note,
        $user
    ]);

    $totalKg = ($newSacks * (float)$product['kg_per_sack']) + $newKg;
    $lowStock = $totalKg <= (float)$product['reorder_level_kg'];

    $conn->commit();

    echo json_encode([
        "success" => true,
        "productName" => $product['product_name'],
        "stockSacks" => $newSacks,
        "stockKg" => $newKg,
        "thresholdKg" => (float)$product['reorder_level_kg'],
        "lowStock" => $lowStock
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>