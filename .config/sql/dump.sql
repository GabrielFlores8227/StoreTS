-- MySQL dump 10.13  Distrib 8.0.33, for Linux (x86_64)
--
-- Host: localhost    Database: StoreTS
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` enum('only') NOT NULL DEFAULT 'only',
  `username` varchar(128) NOT NULL,
  `password` varchar(128) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES ('only','bf95276c15f9b8e4d8f1f154fd4ff51b04b4ae6932dda33f06b32bb76b2f72e09a9c63552768635182989662dad67b4ae397e46becc1ed5ffe953f935e3add27','bf95276c15f9b8e4d8f1f154fd4ff51b04b4ae6932dda33f06b32bb76b2f72e09a9c63552768635182989662dad67b4ae397e46becc1ed5ffe953f935e3add27','');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `position` smallint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `footer`
--

DROP TABLE IF EXISTS `footer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `footer` (
  `id` enum('only') NOT NULL DEFAULT 'only',
  `title` varchar(50) NOT NULL,
  `text` varchar(255) NOT NULL,
  `whatsapp` varchar(13) NOT NULL,
  `facebook` varchar(30) NOT NULL,
  `instagram` varchar(30) NOT NULL,
  `location` text NOT NULL,
  `storeInfo` varchar(50) NOT NULL,
  `completeStoreInfo` varchar(100) NOT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `footer`
--

LOCK TABLES `footer` WRITE;
/*!40000 ALTER TABLE `footer` DISABLE KEYS */;
INSERT INTO `footer` VALUES ('only','StoreTS','Crie portfólios atraentes para lojas, promova produtos e alcance mais clientes com StoreTS. Uma plataforma de vendas online integrada com a AWS e WhatsApp.','9999999999999','@instagram','@facebook','https://www.google.com/maps/@-23.5078035,-47.6090396,15z?entry=ttu','Horário de atendimento: 9:00 - 18:00*','Horário de atendimento em dias úteis dias: 9:00 - 18:00');
/*!40000 ALTER TABLE `footer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `header`
--

DROP TABLE IF EXISTS `header`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `header` (
  `id` enum('only') NOT NULL DEFAULT 'only',
  `icon` varchar(4) NOT NULL DEFAULT 'icon',
  `logo` varchar(4) NOT NULL DEFAULT 'logo',
  `title` varchar(30) NOT NULL,
  `description` varchar(255) NOT NULL,
  `color` varchar(7) NOT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `header`
--

LOCK TABLES `header` WRITE;
/*!40000 ALTER TABLE `header` DISABLE KEYS */;
INSERT INTO `header` VALUES ('only','icon','logo','StoreTS','Crie portfólios atraentes para lojas, promova produtos e alcance mais clientes com StoreTS. Uma plataforma de vendas online integrada com a AWS e WhatsApp.','#ff0000');
/*!40000 ALTER TABLE `header` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `image` varchar(255) NOT NULL,
  `price` float NOT NULL,
  `off` float NOT NULL,
  `installment` varchar(30) NOT NULL,
  `whatsapp` varchar(13) NOT NULL,
  `message` varchar(255) NOT NULL,
  `history` json DEFAULT NULL,
  `position` smallint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `propagandas`
--

DROP TABLE IF EXISTS `propagandas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `propagandas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bigImage` varchar(255) NOT NULL,
  `smallImage` varchar(255) NOT NULL,
  `position` smallint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `propagandas`
--

LOCK TABLES `propagandas` WRITE;
/*!40000 ALTER TABLE `propagandas` DISABLE KEYS */;
/*!40000 ALTER TABLE `propagandas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(255) NOT NULL,
  `expires` bigint NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website`
--

DROP TABLE IF EXISTS `website`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website` (
  `id` enum('only') NOT NULL DEFAULT 'only',
  `history` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website`
--

LOCK TABLES `website` WRITE;
/*!40000 ALTER TABLE `website` DISABLE KEYS */;
INSERT INTO `website` VALUES ('only',NULL);
/*!40000 ALTER TABLE `website` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-06-19 17:39:30
