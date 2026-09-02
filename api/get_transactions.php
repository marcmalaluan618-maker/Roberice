<?php
header("Content-Type: application/json");
require_once "db.php";

try {
    $stmt = $conn->prepare("
        SELECT
            t.transaction_id,
            t.transaction_date,
            t.total_amount,
            t.payment_amount,
            t.change_amount,
            t.payment_method,
            t.transaction_status,
            u.user_id,
            u.username,
            u.full_name
        FROM sales_transaction t
        JOIN users u ON t.user_id = u.user_id
        ORDER BY t.transaction_date DESC
    ");
    $stmt->execute();
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($transactions as &$transaction) {
        $stmtItems = $conn->prepare("
            SELECT
                p.product_name,
                ti.unit,
                ti.quantity,
                ti.unit_price,
                ti.subtotal
            FROM transaction_item ti
            JOIN product p ON ti.product_id = p.product_id
            WHERE ti.transaction_id = ?
        ");

        $stmtItems->execute([$transaction["transaction_id"]]);
        $transaction["items"] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($transactions);

} catch (PDOException $e) {
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>