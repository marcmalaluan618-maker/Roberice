<?php
header("Content-Type: application/json");
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if ($username === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Username and password are required."
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT user_id, username, password, full_name, role, account_status
        FROM users
        WHERE username = ?
        LIMIT 1
    ");

    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid username or password."
        ]);
        exit;
    }

    if ($user["account_status"] !== "Active") {
        echo json_encode([
            "success" => false,
            "message" => "Account is inactive. Please contact the administrator."
        ]);
        exit;
    }

    $validPassword = false;

    if (password_verify($password, $user["password"])) {
        $validPassword = true;
    } elseif (hash_equals($user["password"], $password)) {
        $validPassword = true;

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $update = $conn->prepare("
            UPDATE users
            SET password = ?
            WHERE user_id = ?
        ");

        $update->execute([
            $hashedPassword,
            $user["user_id"]
        ]);
    }

    if (!$validPassword) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid username or password."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => (string)$user["user_id"],
            "username" => $user["username"],
            "name" => $user["full_name"],
            "role" => strtolower($user["role"]),
            "status" => strtolower($user["account_status"])
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Unable to login."
    ]);
}
?>