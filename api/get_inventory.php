<?php
header("Content-Type: application/json");
require_once "db.php";

try {
    $stmt = $conn->prepare("
        SELECT
            p.product_id,
            p.product_name,
            p.category,
            p.kg_per_sack,
            i.stock_sacks,
            i.stock_kg,
            i.reorder_level_kg
        FROM product p
        LEFT JOIN inventory i ON p.product_id = i.product_id
        WHERE p.product_status = 'Active'
        ORDER BY p.product_name
    ");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>