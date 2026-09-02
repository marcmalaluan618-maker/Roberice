-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 02, 2026 at 04:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `roberice_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `stock_sacks` int(11) DEFAULT 0,
  `stock_kg` decimal(10,2) DEFAULT 0.00,
  `reorder_level_kg` decimal(10,2) DEFAULT 200.00,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `product_id`, `stock_sacks`, `stock_kg`, `reorder_level_kg`, `last_updated`) VALUES
(1, 1, 14, 35.00, 200.00, '2026-09-02 11:15:01'),
(2, 2, 10, 0.00, 200.00, '2026-09-02 01:21:46'),
(3, 3, 10, 0.00, 200.00, '2026-09-02 01:26:12'),
(4, 4, 7, 175.00, 100.00, '2026-09-02 19:31:17'),
(5, 5, 10, 0.00, 100.00, '2026-09-02 19:33:08'),
(6, 6, 13, 0.00, 100.00, '2026-09-02 19:33:22'),
(7, 7, 12, 0.00, 100.00, '2026-09-02 19:36:25'),
(8, 8, 8, 25.00, 100.00, '2026-09-02 19:33:35'),
(9, 9, 18, 0.00, 100.00, '2026-09-02 19:33:41'),
(10, 10, 5, 0.00, 150.00, '2026-09-02 20:39:23'),
(11, 11, 5, 0.00, 150.00, '2026-09-02 20:42:32'),
(12, 12, 6, 0.00, 150.00, '2026-09-02 20:50:53');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_adjustment`
--

CREATE TABLE `inventory_adjustment` (
  `adjustment_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `adjustment_date` datetime DEFAULT current_timestamp(),
  `adjustment_type` enum('restock','spoilage','correction') NOT NULL,
  `sacks` int(11) DEFAULT 0,
  `kg` decimal(10,2) DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_adjustment`
--

INSERT INTO `inventory_adjustment` (`adjustment_id`, `product_id`, `adjustment_date`, `adjustment_type`, `sacks`, `kg`, `note`, `performed_by`) VALUES
(1, 1, '2026-09-02 01:41:32', 'restock', 2, 5.00, 'low stock', 'Admin User'),
(2, 1, '2026-09-02 01:45:37', 'restock', 5, 25.00, 'n/a', 'Admin User'),
(3, 6, '2026-09-02 02:10:04', 'restock', 10, 0.00, 'n/a', 'Admin User'),
(4, 8, '2026-09-02 03:21:12', 'restock', 5, 25.00, 'low stock', 'Admin User'),
(5, 4, '2026-09-02 08:50:21', 'restock', 5, 25.00, 'low stock', 'Admin User'),
(6, 4, '2026-09-02 11:16:22', 'restock', 5, 50.00, 'add stock', 'Admin User'),
(7, 4, '2026-09-02 11:16:22', 'restock', 5, 50.00, 'add stock', 'Admin User'),
(8, 4, '2026-09-02 19:29:31', 'restock', 5, 50.00, '', 'Admin User'),
(9, 7, '2026-09-02 19:36:25', 'spoilage', 10, 50.00, 'damage product', 'Admin User'),
(10, 12, '2026-09-02 20:47:54', 'restock', 3, 0.00, '', 'Admin User'),
(11, 12, '2026-09-02 20:49:17', 'spoilage', 1, 0.00, 'damage product', 'Admin User');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price_sack` decimal(10,2) NOT NULL,
  `price_kg` decimal(10,2) NOT NULL,
  `kg_per_sack` decimal(10,2) DEFAULT 50.00,
  `product_status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `product_name`, `category`, `description`, `price_sack`, `price_kg`, `kg_per_sack`, `product_status`) VALUES
(1, 'Premium Rice', 'Aromatic', 'Premium quality Dinorado rice', 2450.00, 55.00, 50.00, 'Inactive'),
(2, 'Dona Maria', 'Aromatic', '', 2757.00, 110.00, 25.00, 'Inactive'),
(3, 'Dona Maria', 'Aromatic', '', 2757.00, 110.00, 25.00, 'Inactive'),
(4, 'Sinandomeng Special', 'Premium White', '', 2100.00, 48.00, 50.00, 'Active'),
(5, 'Dinorado Fancy Rice', 'Aromatic', '', 2450.00, 55.00, 25.00, 'Active'),
(6, 'Jasmine Premium', 'Fragrant Import', '', 2800.00, 62.00, 25.00, 'Active'),
(7, 'Angelika Rice', 'Regular Milled', '', 1950.00, 44.00, 25.00, 'Active'),
(8, 'Malagkit Glutinous', 'Specialty Rice', '', 3100.00, 70.00, 25.00, 'Active'),
(9, 'IR-64 Well_Milled', 'Standard Local', '', 1850.00, 42.00, 25.00, 'Active'),
(10, 'Demo Rice', 'Regular Milled', '', 2000.00, 45.00, 50.00, 'Active'),
(11, 'Demo Rice 2', 'Regular Milled', '', 2000.00, 45.00, 50.00, 'Active'),
(12, 'Demo Rice 3', 'Regular Milled', '', 2100.00, 45.00, 50.00, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `sales_transaction`
--

CREATE TABLE `sales_transaction` (
  `transaction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `transaction_date` datetime DEFAULT current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL,
  `payment_amount` decimal(10,2) NOT NULL,
  `change_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(30) NOT NULL DEFAULT 'Cash',
  `transaction_status` enum('Completed','Cancelled') DEFAULT 'Completed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_transaction`
--

INSERT INTO `sales_transaction` (`transaction_id`, `user_id`, `transaction_date`, `total_amount`, `payment_amount`, `change_amount`, `payment_method`, `transaction_status`) VALUES
(1, 1, '2026-09-02 01:58:57', 2450.00, 3000.00, 550.00, 'Cash', 'Completed'),
(2, 1, '2026-09-02 01:59:22', 2450.00, 3000.00, 550.00, 'Cash', 'Completed'),
(3, 1, '2026-09-02 02:14:42', 4900.00, 5000.00, 100.00, 'Cash', 'Completed'),
(4, 1, '2026-09-02 02:16:44', 2100.00, 3000.00, 900.00, 'Cash', 'Completed'),
(5, 1, '2026-09-02 02:22:06', 3100.00, 3500.00, 400.00, 'Cash', 'Completed'),
(6, 1, '2026-09-02 03:14:39', 25200.00, 26000.00, 800.00, 'Cash', 'Completed'),
(7, 1, '2026-09-02 08:57:41', 14700.00, 15000.00, 300.00, 'Cash', 'Completed'),
(8, 1, '2026-09-02 11:15:01', 2450.00, 3000.00, 550.00, 'Cash', 'Completed'),
(9, 2, '2026-09-02 11:19:06', 2100.00, 2200.00, 100.00, 'Cash', 'Completed'),
(10, 1, '2026-09-02 19:23:08', 14700.00, 14700.00, 0.00, 'Cash', 'Completed'),
(11, 1, '2026-09-02 20:50:53', 2100.00, 2500.00, 400.00, 'Cash', 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `transaction_item`
--

CREATE TABLE `transaction_item` (
  `transaction_item_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transaction_item`
--

INSERT INTO `transaction_item` (`transaction_item_id`, `transaction_id`, `product_id`, `unit`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 1, 'sack', 1.00, 2450.00, 2450.00),
(2, 2, 1, 'sack', 1.00, 2450.00, 2450.00),
(3, 3, 5, 'sack', 2.00, 2450.00, 4900.00),
(4, 4, 4, 'sack', 1.00, 2100.00, 2100.00),
(5, 5, 8, 'sack', 1.00, 3100.00, 3100.00),
(6, 6, 4, 'sack', 12.00, 2100.00, 25200.00),
(7, 7, 4, 'sack', 7.00, 2100.00, 14700.00),
(8, 8, 1, 'sack', 1.00, 2450.00, 2450.00),
(9, 9, 4, 'sack', 1.00, 2100.00, 2100.00),
(10, 10, 4, 'sack', 7.00, 2100.00, 14700.00),
(11, 11, 12, 'sack', 1.00, 2100.00, 2100.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('Admin','Cashier') NOT NULL,
  `account_status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `role`, `account_status`) VALUES
(1, 'admin', '$2y$10$H1Gvo388mvZGq3XOSsepCeX2xMSwf0kR5rKJJJqcSJ3fGu5whyPO6', 'Admin User', 'Admin', 'Active'),
(2, 'cashier1', '$2y$10$RuTRrM9eyIIIw0hqlF50wuHl2aHq3iQGC7SvprF/zJlCo78DRBkYi', 'Maria Santos', 'Cashier', 'Active'),
(3, 'cashier2', '$2y$10$QbscdAndZI4wzJgp3qtrwepvww.I058rK4BWq3NJ0pS5lworkEkjK', 'Juan Dela Cruz', 'Cashier', 'Active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `product_id` (`product_id`);

--
-- Indexes for table `inventory_adjustment`
--
ALTER TABLE `inventory_adjustment`
  ADD PRIMARY KEY (`adjustment_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `sales_transaction`
--
ALTER TABLE `sales_transaction`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `fk_transaction_user` (`user_id`);

--
-- Indexes for table `transaction_item`
--
ALTER TABLE `transaction_item`
  ADD PRIMARY KEY (`transaction_item_id`),
  ADD KEY `fk_item_transaction` (`transaction_id`),
  ADD KEY `fk_item_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `inventory_adjustment`
--
ALTER TABLE `inventory_adjustment`
  MODIFY `adjustment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `sales_transaction`
--
ALTER TABLE `sales_transaction`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `transaction_item`
--
ALTER TABLE `transaction_item`
  MODIFY `transaction_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `inventory_adjustment`
--
ALTER TABLE `inventory_adjustment`
  ADD CONSTRAINT `inventory_adjustment_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `sales_transaction`
--
ALTER TABLE `sales_transaction`
  ADD CONSTRAINT `fk_transaction_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `transaction_item`
--
ALTER TABLE `transaction_item`
  ADD CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `fk_item_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `sales_transaction` (`transaction_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
