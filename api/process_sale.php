<?php
header("Content-Type: application/json");
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$items = $data["items"] ?? [];
$username = trim($data["username"] ?? "");
$paymentReceived = (float)($data["paymentReceived"] ?? 0);
$paymentMethod = trim($data["paymentMethod"] ?? "Cash");

if (empty($items)) {
    echo json_encode(["success" => false, "message" => "Cart is empty."]);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT user_id, full_name
        FROM users
        WHERE username = ? AND account_status = 'Active'
    ");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("Cashier account was not found in the database.");
    }

    $total = 0;
    $processedItems = [];

    foreach ($items as $item) {
        $productId = (int)$item["productId"];
        $unit = $item["unit"];
        $qty = (float)$item["qty"];

        if ($qty <= 0) {
            throw new Exception("Invalid quantity.");
        }

        if ($unit === "sack" && floor($qty) != $qty) {
            throw new Exception("Sack quantity must be a whole number.");
        }

        $stmt = $conn->prepare("
            SELECT
                p.product_name,
                p.price_sack,
                p.price_kg,
                p.kg_per_sack,
                i.stock_sacks,
                i.stock_kg
            FROM product p
            JOIN inventory i ON p.product_id = i.product_id
            WHERE p.product_id = ?
            AND p.product_status = 'Active'
            FOR UPDATE
        ");
        $stmt->execute([$productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            throw new Exception("Product not found.");
        }

        $stockSacks = (int)$product["stock_sacks"];
        $stockKg = (float)$product["stock_kg"];
        $kgPerSack = (float)$product["kg_per_sack"];

        if ($unit === "sack") {
            if ($qty > $stockSacks) {
                throw new Exception("Insufficient sack stock for " . $product["product_name"] . ".");
            }

            $stockSacks -= (int)$qty;
            $unitPrice = (float)$product["price_sack"];
        } else {
            $totalAvailableKg = ($stockSacks * $kgPerSack) + $stockKg;

            if ($qty > $totalAvailableKg) {
                throw new Exception("Insufficient kg stock for " . $product["product_name"] . ".");
            }

            if ($stockKg >= $qty) {
                $stockKg -= $qty;
            } else {
                $neededKg = $qty - $stockKg;
                $sacksToOpen = (int)ceil($neededKg / $kgPerSack);

                $stockSacks -= $sacksToOpen;
                $stockKg = ($stockKg + ($sacksToOpen * $kgPerSack)) - $qty;
            }

            $unitPrice = (float)$product["price_kg"];
        }

        $subtotal = $unitPrice * $qty;
        $total += $subtotal;

        $processedItems[] = [
            "productId" => $productId,
            "productName" => $product["product_name"],
            "unit" => $unit,
            "qty" => $qty,
            "unitPrice" => $unitPrice,
            "subtotal" => $subtotal
        ];

        $stmt = $conn->prepare("
            UPDATE inventory
            SET stock_sacks = ?, stock_kg = ?
            WHERE product_id = ?
        ");
        $stmt->execute([$stockSacks, $stockKg, $productId]);
    }

    if ($paymentReceived < $total) {
        throw new Exception("Payment received is insufficient.");
    }

    $change = $paymentReceived - $total;

    $stmt = $conn->prepare("
        INSERT INTO sales_transaction
        (user_id, total_amount, payment_amount, change_amount, payment_method, transaction_status)
        VALUES (?, ?, ?, ?, ?, 'Completed')
    ");

    $stmt->execute([
        $user["user_id"],
        $total,
        $paymentReceived,
        $change,
        $paymentMethod
    ]);

    $transactionId = $conn->lastInsertId();

    $itemStmt = $conn->prepare("
        INSERT INTO transaction_item
        (transaction_id, product_id, unit, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($processedItems as $item) {
        $itemStmt->execute([
            $transactionId,
            $item["productId"],
            $item["unit"],
            $item["qty"],
            $item["unitPrice"],
            $item["subtotal"]
        ]);
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "transactionId" => $transactionId,
        "cashierName" => $user["full_name"],
        "totalAmount" => $total,
        "paymentReceived" => $paymentReceived,
        "changeAmount" => $change,
        "paymentMethod" => $paymentMethod,
        "items" => $processedItems
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>