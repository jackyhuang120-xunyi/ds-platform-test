-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: ds_data_test1
-- ------------------------------------------------------
-- Server version	8.0.42

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
-- Table structure for table `body_part`
--

DROP TABLE IF EXISTS `body_part`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `body_part` (
  `id` tinyint NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  UNIQUE KEY `sqlite_autoindex_body_part_1` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gender`
--

DROP TABLE IF EXISTS `gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gender` (
  `id` tinyint NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  UNIQUE KEY `sqlite_autoindex_gender_1` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group` (
  `id` tinyint NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  UNIQUE KEY `sqlite_autoindex_group_1` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rom`
--

DROP TABLE IF EXISTS `rom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `a` float NOT NULL,
  `b` float NOT NULL,
  `angle1` float NOT NULL DEFAULT '0',
  `angle2` float NOT NULL DEFAULT '0',
  `angle3` float NOT NULL DEFAULT '0',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_rom_1` (`id`),
  UNIQUE KEY `sqlite_autoindex_rom_2` (`uid`),
  CONSTRAINT `rom_FK_0_0` FOREIGN KEY (`uid`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_record`
--

DROP TABLE IF EXISTS `test_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_record` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `type` tinyint NOT NULL,
  `part` tinyint DEFAULT NULL,
  `cfg_roma` int DEFAULT NULL,
  `cfg_romb` int DEFAULT NULL,
  `cfg_stre` int DEFAULT NULL,
  `cfg_con_speed` int DEFAULT NULL,
  `cfg_ecc_speed` int DEFAULT NULL,
  `cfg_pos` int DEFAULT NULL,
  `cfg_group` tinyint DEFAULT NULL,
  `cfg_rest_time` int DEFAULT NULL,
  `con_stre_max` float DEFAULT NULL,
  `con_stre_avg` float DEFAULT NULL,
  `con_speed_max` float DEFAULT NULL,
  `con_speed_avg` float DEFAULT NULL,
  `con_power_max` float DEFAULT NULL,
  `con_power_avg` float DEFAULT NULL,
  `con_work_max` float DEFAULT NULL,
  `con_work_avg` float DEFAULT NULL,
  `ecc_stre_max` float DEFAULT NULL,
  `ecc_stre_avg` float DEFAULT NULL,
  `ecc_speed_max` float DEFAULT NULL,
  `ecc_speed_avg` float DEFAULT NULL,
  `ecc_power_max` float DEFAULT NULL,
  `ecc_power_avg` float DEFAULT NULL,
  `ecc_work_max` float DEFAULT NULL,
  `ecc_work_avg` float DEFAULT NULL,
  `result` int DEFAULT NULL,
  `begin_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `log` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `video` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_test_record_1` (`id`),
  KEY `test_record_FK_0_0` (`type`),
  KEY `test_record_FK_1_0` (`uid`),
  CONSTRAINT `test_record_FK_0_0` FOREIGN KEY (`type`) REFERENCES `test_type` (`id`),
  CONSTRAINT `test_record_FK_1_0` FOREIGN KEY (`uid`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=695 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `test_record_view`
--

DROP TABLE IF EXISTS `test_record_view`;
/*!50001 DROP VIEW IF EXISTS `test_record_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `test_record_view` AS SELECT 
 1 AS `id`,
 1 AS `user_name`,
 1 AS `id_number`,
 1 AS `group_name`,
 1 AS `part_name`,
 1 AS `type_name`,
 1 AS `time`,
 1 AS `uid`,
 1 AS `group_id`,
 1 AS `part_id`,
 1 AS `type_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `test_type`
--

DROP TABLE IF EXISTS `test_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_type` (
  `id` tinyint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `train_record`
--

DROP TABLE IF EXISTS `train_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `train_record` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `type` tinyint NOT NULL,
  `part` tinyint NOT NULL DEFAULT '1',
  `cfg_roma` int DEFAULT NULL,
  `cfg_romb` int DEFAULT NULL,
  `cfg_con_stre` int DEFAULT NULL,
  `cfg_ecc_stre` int DEFAULT NULL,
  `cfg_con_speed` int DEFAULT NULL,
  `cfg_ecc_speed` int DEFAULT NULL,
  `cfg_train_time` int DEFAULT NULL,
  `cfg_relax_time` int DEFAULT NULL,
  `cfg_train_pos` int DEFAULT NULL,
  `cfg_count` tinyint DEFAULT NULL,
  `cfg_group` tinyint DEFAULT NULL,
  `cfg_rest_time` int DEFAULT NULL,
  `con_stre_max` float DEFAULT NULL,
  `con_stre_avg` float DEFAULT NULL,
  `con_speed_max` float DEFAULT NULL,
  `con_speed_avg` float DEFAULT NULL,
  `con_power_max` float DEFAULT NULL,
  `con_power_avg` float DEFAULT NULL,
  `con_work_max` float DEFAULT NULL,
  `con_work_avg` float DEFAULT NULL,
  `ecc_stre_max` float DEFAULT NULL,
  `ecc_stre_avg` float DEFAULT NULL,
  `ecc_speed_max` float DEFAULT NULL,
  `ecc_speed_avg` float DEFAULT NULL,
  `ecc_power_max` float DEFAULT NULL,
  `ecc_power_avg` float DEFAULT NULL,
  `ecc_work_max` float DEFAULT NULL,
  `ecc_work_avg` float DEFAULT NULL,
  `result` int DEFAULT NULL,
  `begin_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `log` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `video` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_train_record_1` (`id`),
  KEY `train_record_FK_0_0` (`part`),
  KEY `train_record_FK_1_0` (`type`),
  KEY `train_record_FK_2_0` (`uid`),
  CONSTRAINT `train_record_FK_0_0` FOREIGN KEY (`part`) REFERENCES `body_part` (`id`),
  CONSTRAINT `train_record_FK_1_0` FOREIGN KEY (`type`) REFERENCES `train_type` (`id`),
  CONSTRAINT `train_record_FK_2_0` FOREIGN KEY (`uid`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=422 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `train_record_view`
--

DROP TABLE IF EXISTS `train_record_view`;
/*!50001 DROP VIEW IF EXISTS `train_record_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `train_record_view` AS SELECT 
 1 AS `id`,
 1 AS `user_name`,
 1 AS `id_number`,
 1 AS `group_name`,
 1 AS `part_name`,
 1 AS `type_name`,
 1 AS `time`,
 1 AS `uid`,
 1 AS `group_id`,
 1 AS `part_id`,
 1 AS `type_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `train_type`
--

DROP TABLE IF EXISTS `train_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `train_type` (
  `id` tinyint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `gender` tinyint DEFAULT NULL,
  `age` tinyint DEFAULT NULL,
  `height` tinyint DEFAULT NULL,
  `weight` tinyint DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_number` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `group` tinyint DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `remark` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_FK_0_0` (`group`),
  KEY `user_FK_1_0` (`gender`),
  CONSTRAINT `user_FK_0_0` FOREIGN KEY (`group`) REFERENCES `group` (`id`),
  CONSTRAINT `user_FK_1_0` FOREIGN KEY (`gender`) REFERENCES `gender` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=426 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `user_view`
--

DROP TABLE IF EXISTS `user_view`;
/*!50001 DROP VIEW IF EXISTS `user_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `user_view` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `gender`,
 1 AS `age`,
 1 AS `id_number`,
 1 AS `group`,
 1 AS `height`,
 1 AS `weight`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `test_record_view`
--

/*!50001 DROP VIEW IF EXISTS `test_record_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `test_record_view` AS select `tr`.`id` AS `id`,`u`.`name` AS `user_name`,`u`.`id_number` AS `id_number`,`g`.`name` AS `group_name`,`bp`.`name` AS `part_name`,`tt`.`name` AS `type_name`,`tr`.`begin_time` AS `time`,`tr`.`uid` AS `uid`,`u`.`group` AS `group_id`,`tr`.`part` AS `part_id`,`tr`.`type` AS `type_id` from ((((`user` `u` join `test_record` `tr`) join `test_type` `tt`) join `body_part` `bp`) join `group` `g`) where ((`u`.`id` = `tr`.`uid`) and (`tr`.`type` = `tt`.`id`) and (`tr`.`part` = `bp`.`id`) and (`u`.`group` = `g`.`id`) and (`tr`.`end_time` is not null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `train_record_view`
--

/*!50001 DROP VIEW IF EXISTS `train_record_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `train_record_view` AS select `tr`.`id` AS `id`,`u`.`name` AS `user_name`,`u`.`id_number` AS `id_number`,`g`.`name` AS `group_name`,`bp`.`name` AS `part_name`,`tt`.`name` AS `type_name`,`tr`.`begin_time` AS `time`,`tr`.`uid` AS `uid`,`u`.`group` AS `group_id`,`tr`.`part` AS `part_id`,`tr`.`type` AS `type_id` from ((((`user` `u` join `train_record` `tr`) join `train_type` `tt`) join `body_part` `bp`) join `group` `g`) where ((`u`.`id` = `tr`.`uid`) and (`tr`.`type` = `tt`.`id`) and (`tr`.`part` = `bp`.`id`) and (`u`.`group` = `g`.`id`) and (`tr`.`end_time` is not null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `user_view`
--

/*!50001 DROP VIEW IF EXISTS `user_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `user_view` AS select `u`.`id` AS `id`,`u`.`name` AS `name`,`g`.`name` AS `gender`,timestampdiff(YEAR,`u`.`birthday`,curdate()) AS `age`,`u`.`id_number` AS `id_number`,`u`.`group` AS `group`,`u`.`height` AS `height`,`u`.`weight` AS `weight` from (`user` `u` join `gender` `g`) where (`u`.`gender` = `g`.`id`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 12:35:23
