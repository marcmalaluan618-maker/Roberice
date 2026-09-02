<?php

header("Content-Type: application/json");

require_once "db.php";

try {

    $sql = "
        SELECT
            p.product_id,
            p.product_name,
            p.category,
            p.description,
            p.price_sack,
            p.price_kg,
            p.kg_per_sack,
            p.product_status,

            i.inventory_id,
            i.stock_sacks,
            i.stock_kg,
            i.reorder_level_kg

        FROM product p

        LEFT JOIN inventory i
        ON p.product_id = i.product_id

        WHERE p.product_status = 'Active'
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($products);

} catch (PDOException $e) {

    echo json_encode([
        "error" => $e->getMessage()
    ]);

}

?>