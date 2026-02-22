CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`image` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(500) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`price` decimal(10,2) NOT NULL,
	`notes` text,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`status` enum('pending','approved','rejected','cancelled','shipped','delivered') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paymentId` varchar(255),
	`mpPaymentId` varchar(255),
	`shippingMethod` varchar(100),
	`shippingPrice` decimal(10,2) DEFAULT '0',
	`shippingCep` varchar(10),
	`subtotal` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerCpf` varchar(14),
	`customerEmail` varchar(320),
	`customerPhone` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(500) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`discountPercent` int DEFAULT 0,
	`categoryLine` varchar(100) NOT NULL,
	`material` varchar(100) NOT NULL,
	`accessoryType` varchar(100) NOT NULL,
	`images` json,
	`featured` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`stock` int DEFAULT 0,
	`displayOrder` int NOT NULL DEFAULT 0,
	`weightGrams` int,
	`lengthCm` int,
	`widthCm` int,
	`heightCm` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
