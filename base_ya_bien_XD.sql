-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: lingualab2
-- ------------------------------------------------------
-- Server version	8.0.43

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
-- Table structure for table `actividad_grupo`
--

DROP TABLE IF EXISTS `actividad_grupo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad_grupo` (
  `id_actividad_grupo` int NOT NULL AUTO_INCREMENT,
  `id_actividad_ag_fk` int DEFAULT NULL,
  `id_grupo_ag_fk` int DEFAULT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_limite` date DEFAULT NULL,
  `intentos_permitidos` int DEFAULT NULL,
  `visible_para_alumnos` tinyint(1) DEFAULT '1',
  `obligatorio` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_actividad_grupo`),
  KEY `id_actividad_ag_fk` (`id_actividad_ag_fk`),
  KEY `id_grupo_ag_fk` (`id_grupo_ag_fk`),
  KEY `idx_fecha_limite` (`fecha_limite`),
  KEY `idx_visible` (`visible_para_alumnos`),
  CONSTRAINT `actividad_grupo_ibfk_1` FOREIGN KEY (`id_actividad_ag_fk`) REFERENCES `actividades` (`id_actividad`),
  CONSTRAINT `actividad_grupo_ibfk_2` FOREIGN KEY (`id_grupo_ag_fk`) REFERENCES `grupos` (`id_grupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividad_grupo`
--

LOCK TABLES `actividad_grupo` WRITE;
/*!40000 ALTER TABLE `actividad_grupo` DISABLE KEYS */;
/*!40000 ALTER TABLE `actividad_grupo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actividades`
--

DROP TABLE IF EXISTS `actividades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividades` (
  `id_actividad` int NOT NULL AUTO_INCREMENT,
  `id_docente_actividad_fk` int DEFAULT NULL,
  `id_juego_actividad_fk` int DEFAULT NULL,
  `id_vocabulario_fk` int DEFAULT NULL,
  `titulo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `numero_palabras` int DEFAULT '10',
  `unidades_seleccionadas` json DEFAULT NULL,
  `palabras_seleccionadas` json DEFAULT NULL,
  `modo_seleccion` enum('todas','por_unidad','manual','random') COLLATE utf8mb4_unicode_ci DEFAULT 'por_unidad',
  `nivel` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'A1',
  `experiencia_minima` int DEFAULT '80',
  `experiencia_maxima` int DEFAULT '150',
  `experiencia_base` int DEFAULT '100',
  `experiencia_bonus_perfecto` int DEFAULT '50',
  `puntuacion_minima_aprobar` int DEFAULT '70',
  `auto_refresh` tinyint(1) DEFAULT '0',
  `refresh_frequency` enum('daily','weekly','biweekly','monthly') COLLATE utf8mb4_unicode_ci DEFAULT 'weekly',
  `refresh_type` enum('palabras','dificultad','ambos') COLLATE utf8mb4_unicode_ci DEFAULT 'palabras',
  `ultima_actualizacion` timestamp NULL DEFAULT NULL,
  `tiempo_limite` int DEFAULT NULL,
  `mostrar_temporizador` tinyint(1) DEFAULT '1',
  `intentos_permitidos` int DEFAULT NULL,
  `permitir_reintentos` tinyint(1) DEFAULT '1',
  `mostrar_definiciones` tinyint(1) DEFAULT '1',
  `permitir_pistas` tinyint(1) DEFAULT '1',
  `penalizacion_por_pista` int DEFAULT '5',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_limite` date DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  `publicado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_actividad`),
  KEY `id_docente_actividad_fk` (`id_docente_actividad_fk`),
  KEY `id_juego_actividad_fk` (`id_juego_actividad_fk`),
  KEY `fk_actividades_vocabulario` (`id_vocabulario_fk`),
  KEY `idx_auto_refresh` (`auto_refresh`,`ultima_actualizacion`),
  KEY `idx_nivel` (`nivel`),
  KEY `idx_publicado` (`publicado`),
  CONSTRAINT `actividades_ibfk_1` FOREIGN KEY (`id_docente_actividad_fk`) REFERENCES `docentes` (`id_docente`),
  CONSTRAINT `actividades_ibfk_2` FOREIGN KEY (`id_juego_actividad_fk`) REFERENCES `juegos` (`id_juego`),
  CONSTRAINT `fk_actividades_vocabulario` FOREIGN KEY (`id_vocabulario_fk`) REFERENCES `vocabulario` (`id_vocabulario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividades`
--

LOCK TABLES `actividades` WRITE;
/*!40000 ALTER TABLE `actividades` DISABLE KEYS */;
/*!40000 ALTER TABLE `actividades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administradores`
--

DROP TABLE IF EXISTS `administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores` (
  `id_admin` int NOT NULL AUTO_INCREMENT,
  `id_usuario_admin_fk` int DEFAULT NULL,
  `permisos` json DEFAULT NULL,
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `id_usuario_admin_fk` (`id_usuario_admin_fk`),
  CONSTRAINT `administradores_ibfk_1` FOREIGN KEY (`id_usuario_admin_fk`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administradores`
--

LOCK TABLES `administradores` WRITE;
/*!40000 ALTER TABLE `administradores` DISABLE KEYS */;
INSERT INTO `administradores` VALUES (1,1,'{}'),(2,2,'{}'),(3,3,'{\"super\": true}'),(4,6,'{}');
/*!40000 ALTER TABLE `administradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumno_grupo`
--

DROP TABLE IF EXISTS `alumno_grupo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno_grupo` (
  `id_alumno_grupo` int NOT NULL AUTO_INCREMENT,
  `id_grupo_ag_fk` int DEFAULT NULL,
  `id_alumno_ag_fk` int DEFAULT NULL,
  `fecha_ingreso` date DEFAULT (curdate()),
  `activo` tinyint(1) DEFAULT '1',
  `fecha_egreso` date DEFAULT NULL,
  PRIMARY KEY (`id_alumno_grupo`),
  KEY `id_alumno_ag_fk` (`id_alumno_ag_fk`),
  KEY `id_grupo_ag_fk` (`id_grupo_ag_fk`),
  CONSTRAINT `alumno_grupo_ibfk_1` FOREIGN KEY (`id_alumno_ag_fk`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE,
  CONSTRAINT `alumno_grupo_ibfk_2` FOREIGN KEY (`id_grupo_ag_fk`) REFERENCES `grupos` (`id_grupo`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumno_grupo`
--

LOCK TABLES `alumno_grupo` WRITE;
/*!40000 ALTER TABLE `alumno_grupo` DISABLE KEYS */;
INSERT INTO `alumno_grupo` VALUES (11,3,7,'2025-11-17',1,NULL),(12,3,6,'2025-11-17',1,NULL),(13,3,3,'2025-11-17',1,NULL),(14,3,10,'2025-11-17',1,NULL),(15,3,9,'2025-11-17',1,NULL),(16,3,4,'2025-11-17',1,NULL),(17,3,5,'2025-11-17',1,NULL),(18,3,2,'2025-11-17',1,NULL),(19,3,1,'2025-11-17',1,NULL),(20,3,8,'2025-11-17',1,NULL),(21,3,11,'2025-11-19',0,'2025-11-19');
/*!40000 ALTER TABLE `alumno_grupo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumnos`
--

DROP TABLE IF EXISTS `alumnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumnos` (
  `id_alumno` int NOT NULL AUTO_INCREMENT,
  `id_usuario_alumno_fk` int DEFAULT NULL,
  `matricula` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_programa_alumno_fk` int DEFAULT NULL,
  `id_nivel_alumno_fk` int DEFAULT NULL,
  `id_cohorte_alumno_fk` int DEFAULT NULL,
  `experiencia_total` int DEFAULT '0',
  `promedio_general` decimal(5,2) DEFAULT '0.00',
  `actividades_completadas` int DEFAULT '0',
  `nivel_actual` int DEFAULT '1',
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alumno`),
  UNIQUE KEY `id_usuario_alumno_fk` (`id_usuario_alumno_fk`),
  UNIQUE KEY `matricula` (`matricula`),
  KEY `idx_alumnos_programa_fk` (`id_programa_alumno_fk`),
  KEY `idx_alumnos_nivel_fk` (`id_nivel_alumno_fk`),
  KEY `idx_alumnos_cohorte` (`id_cohorte_alumno_fk`),
  CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_usuario_alumno_fk`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_alumnos_cohorte` FOREIGN KEY (`id_cohorte_alumno_fk`) REFERENCES `cohortes` (`id_cohorte`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_alumnos_nivel` FOREIGN KEY (`id_nivel_alumno_fk`) REFERENCES `niveles_educativos` (`id_nivel`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_alumnos_programa` FOREIGN KEY (`id_programa_alumno_fk`) REFERENCES `programas_educativos` (`id_programa`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumnos`
--

LOCK TABLES `alumnos` WRITE;
/*!40000 ALTER TABLE `alumnos` DISABLE KEYS */;
INSERT INTO `alumnos` VALUES (1,10,'1723110513',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(2,11,'1723110657',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(3,12,'1723110044',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(4,13,'1723110777',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(5,14,'1723110986',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(6,15,'1723110321',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(7,16,'1723110555',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(8,17,'1723110051',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(9,18,'1723110889',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(10,19,'1723110312',9,1,NULL,0,0.00,0,1,'2025-11-18 00:13:58'),(11,20,'17233110312',NULL,NULL,NULL,0,0.00,0,1,'2025-11-17 23:45:01'),(12,21,'1723110545',NULL,NULL,NULL,0,0.00,0,1,'2025-11-18 20:15:12'),(13,22,'1723110447',NULL,NULL,NULL,0,0.00,0,1,'2025-11-19 21:20:49');
/*!40000 ALTER TABLE `alumnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cohortes`
--

DROP TABLE IF EXISTS `cohortes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cohortes` (
  `id_cohorte` int NOT NULL AUTO_INCREMENT,
  `anio_ingreso` smallint NOT NULL,
  `cuatrimestre_inicial` tinyint NOT NULL,
  `id_programa_cohorte_fk` int NOT NULL,
  `id_nivel_inicial_fk` int NOT NULL,
  `etiqueta` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cohorte`),
  UNIQUE KEY `uq_cohorte_etiqueta` (`etiqueta`),
  KEY `idx_cohortes_programa` (`id_programa_cohorte_fk`),
  KEY `idx_cohortes_nivel` (`id_nivel_inicial_fk`),
  CONSTRAINT `fk_cohortes_nivel` FOREIGN KEY (`id_nivel_inicial_fk`) REFERENCES `niveles_educativos` (`id_nivel`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cohortes_programa` FOREIGN KEY (`id_programa_cohorte_fk`) REFERENCES `programas_educativos` (`id_programa`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cohortes`
--

LOCK TABLES `cohortes` WRITE;
/*!40000 ALTER TABLE `cohortes` DISABLE KEYS */;
INSERT INTO `cohortes` VALUES (1,2025,1,9,1,'2025-C1-EyDS-TSU',1,'2025-11-18 00:13:58','2025-11-18 00:13:58');
/*!40000 ALTER TABLE `cohortes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuatrimestres`
--

DROP TABLE IF EXISTS `cuatrimestres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuatrimestres` (
  `id_cuatrimestre` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `orden` int DEFAULT '0',
  `creado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cuatrimestre`),
  UNIQUE KEY `uq_cuatrimestres_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuatrimestres`
--

LOCK TABLES `cuatrimestres` WRITE;
/*!40000 ALTER TABLE `cuatrimestres` DISABLE KEYS */;
INSERT INTO `cuatrimestres` VALUES (1,'1','C1',1,1,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(2,'2','C2',1,2,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(3,'3','C3',1,3,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(4,'4','C4',1,4,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(5,'5','C5',1,5,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(6,'6','C6',1,6,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(7,'7','C7',1,7,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(8,'8','C8',1,8,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(9,'9','C9',1,9,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(10,'10','C10',1,10,'2025-11-15 21:44:55','2025-11-15 21:44:55'),(11,'11','C11',0,11,'2025-11-15 21:44:55','2025-11-15 21:45:28');
/*!40000 ALTER TABLE `cuatrimestres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `docente_grupo`
--

DROP TABLE IF EXISTS `docente_grupo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docente_grupo` (
  `id_docente_grupo` int NOT NULL AUTO_INCREMENT,
  `id_docente_dg_fk` int NOT NULL,
  `id_grupo_dg_fk` int NOT NULL,
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_docente_grupo`),
  UNIQUE KEY `uq_docente_grupo_activo` (`id_docente_dg_fk`,`id_grupo_dg_fk`,`activo`),
  KEY `id_grupo_dg_fk` (`id_grupo_dg_fk`),
  CONSTRAINT `docente_grupo_ibfk_1` FOREIGN KEY (`id_docente_dg_fk`) REFERENCES `docentes` (`id_docente`),
  CONSTRAINT `docente_grupo_ibfk_2` FOREIGN KEY (`id_grupo_dg_fk`) REFERENCES `grupos` (`id_grupo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docente_grupo`
--

LOCK TABLES `docente_grupo` WRITE;
/*!40000 ALTER TABLE `docente_grupo` DISABLE KEYS */;
INSERT INTO `docente_grupo` VALUES (1,1,3,'2025-11-18 20:21:18',NULL,1,'2025-11-18 20:21:18');
/*!40000 ALTER TABLE `docente_grupo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `docentes`
--

DROP TABLE IF EXISTS `docentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docentes` (
  `id_docente` int NOT NULL AUTO_INCREMENT,
  `id_usuario_docente_fk` int DEFAULT NULL,
  `matricula` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_docente`),
  UNIQUE KEY `id_usuario_docente_fk` (`id_usuario_docente_fk`),
  UNIQUE KEY `matricula` (`matricula`),
  CONSTRAINT `docentes_ibfk_1` FOREIGN KEY (`id_usuario_docente_fk`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docentes`
--

LOCK TABLES `docentes` WRITE;
/*!40000 ALTER TABLE `docentes` DISABLE KEYS */;
INSERT INTO `docentes` VALUES (1,5,'1723110222',1),(2,7,'1723110020',1),(3,8,'1723110457',1),(4,9,'1723110276',1),(5,23,'1723110979',1);
/*!40000 ALTER TABLE `docentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `errores_alumno`
--

DROP TABLE IF EXISTS `errores_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `errores_alumno` (
  `id_error_alumno` int NOT NULL AUTO_INCREMENT,
  `id_resultado_error_fk` int DEFAULT NULL,
  `id_tipo_error_ea_fk` int DEFAULT NULL,
  `item` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `respuesta` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correcto` tinyint(1) DEFAULT NULL,
  `detalle` json DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_error_alumno`),
  KEY `id_resultado_error_fk` (`id_resultado_error_fk`),
  KEY `id_tipo_error_ea_fk` (`id_tipo_error_ea_fk`),
  CONSTRAINT `errores_alumno_ibfk_1` FOREIGN KEY (`id_resultado_error_fk`) REFERENCES `resultados` (`id_resultado`) ON DELETE CASCADE,
  CONSTRAINT `errores_alumno_ibfk_2` FOREIGN KEY (`id_tipo_error_ea_fk`) REFERENCES `tipos_error` (`id_tipo_error`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `errores_alumno`
--

LOCK TABLES `errores_alumno` WRITE;
/*!40000 ALTER TABLE `errores_alumno` DISABLE KEYS */;
/*!40000 ALTER TABLE `errores_alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estadisticas_alumno`
--

DROP TABLE IF EXISTS `estadisticas_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadisticas_alumno` (
  `id_estadistica` int NOT NULL AUTO_INCREMENT,
  `id_alumno_estadistica_fk` int DEFAULT NULL,
  `total_puntaje` int DEFAULT '0',
  `total_aciertos` int DEFAULT '0',
  `total_errores` int DEFAULT '0',
  `total_tiempo_segundos` int DEFAULT '0',
  `experiencia_basico` int DEFAULT '0',
  `experiencia_intermedio` int DEFAULT '0',
  `experiencia_avanzado` int DEFAULT '0',
  `juegos_completados` int DEFAULT '0',
  `racha_actual` int DEFAULT '0',
  `mejor_racha` int DEFAULT '0',
  `primera_actividad` date DEFAULT NULL,
  `ultima_actividad` timestamp NULL DEFAULT NULL,
  `eficiencia` decimal(5,2) DEFAULT '0.00',
  `velocidad_promedio` decimal(8,2) DEFAULT '0.00',
  PRIMARY KEY (`id_estadistica`),
  UNIQUE KEY `id_alumno_estadistica_fk` (`id_alumno_estadistica_fk`),
  CONSTRAINT `estadisticas_alumno_ibfk_1` FOREIGN KEY (`id_alumno_estadistica_fk`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estadisticas_alumno`
--

LOCK TABLES `estadisticas_alumno` WRITE;
/*!40000 ALTER TABLE `estadisticas_alumno` DISABLE KEYS */;
/*!40000 ALTER TABLE `estadisticas_alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estadisticas_palabras`
--

DROP TABLE IF EXISTS `estadisticas_palabras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadisticas_palabras` (
  `id_estadistica_palabra` int NOT NULL AUTO_INCREMENT,
  `id_alumno_fk` int NOT NULL,
  `palabra` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `significado` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veces_vista` int DEFAULT '0',
  `veces_correcta` int DEFAULT '0',
  `veces_incorrecta` int DEFAULT '0',
  `tasa_exito` decimal(5,2) DEFAULT '0.00',
  `ultima_vez_vista` timestamp NULL DEFAULT NULL,
  `primera_vez_vista` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `nivel_dominio` enum('bajo','medio','alto','dominado') COLLATE utf8mb4_unicode_ci DEFAULT 'bajo',
  `tiempo_promedio_respuesta` int DEFAULT '0',
  PRIMARY KEY (`id_estadistica_palabra`),
  UNIQUE KEY `unique_alumno_palabra` (`id_alumno_fk`,`palabra`),
  KEY `idx_nivel_dominio` (`nivel_dominio`),
  KEY `idx_tasa_exito` (`tasa_exito`),
  KEY `idx_ultima_vista` (`ultima_vez_vista`),
  CONSTRAINT `estadisticas_palabras_ibfk_1` FOREIGN KEY (`id_alumno_fk`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estadisticas_palabras`
--

LOCK TABLES `estadisticas_palabras` WRITE;
/*!40000 ALTER TABLE `estadisticas_palabras` DISABLE KEYS */;
/*!40000 ALTER TABLE `estadisticas_palabras` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_actualizar_estadisticas_alumno_from_palabras` AFTER UPDATE ON `estadisticas_palabras` FOR EACH ROW BEGIN
    DECLARE v_total_vistas INT DEFAULT 0;
    DECLARE v_total_correctas INT DEFAULT 0;
    DECLARE v_total_incorrectas INT DEFAULT 0;

    SELECT 
        SUM(veces_vista),
        SUM(veces_correcta),
        SUM(veces_incorrecta)
    INTO v_total_vistas, v_total_correctas, v_total_incorrectas
    FROM estadisticas_palabras
    WHERE id_alumno_fk = NEW.id_alumno_fk;

    UPDATE estadisticas_alumno
    SET 
        total_aciertos = v_total_correctas,
        total_errores = v_total_incorrectas,
        ultima_actividad = NOW()
    WHERE id_alumno_estadistica_fk = NEW.id_alumno_fk;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `grupos`
--

DROP TABLE IF EXISTS `grupos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos` (
  `id_grupo` int NOT NULL AUTO_INCREMENT,
  `id_docente_grupo_fk` int DEFAULT NULL,
  `nombre` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_cuatrimestre_grupo_fk` int NOT NULL,
  `id_cohorte_grupo_fk` int DEFAULT NULL,
  `estado_practicas` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_grupo`),
  KEY `id_docente_grupo_fk` (`id_docente_grupo_fk`),
  KEY `fk_grupos_cuatrimestre` (`id_cuatrimestre_grupo_fk`),
  KEY `idx_grupos_cohorte` (`id_cohorte_grupo_fk`),
  CONSTRAINT `fk_grupos_cohorte` FOREIGN KEY (`id_cohorte_grupo_fk`) REFERENCES `cohortes` (`id_cohorte`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_grupos_cuatrimestre` FOREIGN KEY (`id_cuatrimestre_grupo_fk`) REFERENCES `cuatrimestres` (`id_cuatrimestre`),
  CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`id_docente_grupo_fk`) REFERENCES `docentes` (`id_docente`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupos`
--

LOCK TABLES `grupos` WRITE;
/*!40000 ALTER TABLE `grupos` DISABLE KEYS */;
INSERT INTO `grupos` VALUES (3,NULL,'1',2,1,0);
/*!40000 ALTER TABLE `grupos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `juegos`
--

DROP TABLE IF EXISTS `juegos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `juegos` (
  `id_juego` int NOT NULL AUTO_INCREMENT,
  `id_admin_juego_fk` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `tipo_juego` enum('hangman','memory','matching','fill_blanks','multiple_choice','flashcards','word_search','crossword','spelling','sentence_builder') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_icono` enum('emoji','class','url') COLLATE utf8mb4_unicode_ci DEFAULT 'emoji',
  `es_plantilla` tinyint(1) DEFAULT '0',
  `dificultad` enum('básico','intermedio','avanzado') COLLATE utf8mb4_unicode_ci DEFAULT 'básico',
  `estructura` json DEFAULT NULL,
  `experiencia_min` int DEFAULT '80',
  `experiencia_max` int DEFAULT '120',
  `palabras_minimas` int DEFAULT '5',
  `palabras_maximas` int DEFAULT '20',
  `instrucciones_template` text COLLATE utf8mb4_unicode_ci,
  `nivel_sugerido` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'A1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_juego`),
  KEY `id_admin_juego_fk` (`id_admin_juego_fk`),
  KEY `idx_tipo_juego` (`tipo_juego`),
  KEY `idx_plantilla` (`es_plantilla`),
  CONSTRAINT `juegos_ibfk_1` FOREIGN KEY (`id_admin_juego_fk`) REFERENCES `administradores` (`id_admin`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `juegos`
--

LOCK TABLES `juegos` WRITE;
/*!40000 ALTER TABLE `juegos` DISABLE KEYS */;
INSERT INTO `juegos` VALUES (1,1,'Hangman','Classic hangman game where students guess letters to form words','hangman','🎯','emoji',1,'básico','{\"show_hints\": true, \"time_limit\": null, \"max_attempts\": 6, \"case_sensitive\": false, \"show_definition\": true, \"hint_after_attempts\": 3}',80,120,5,15,'Guess the word by selecting letters. You have {max_attempts} attempts!','A1','2025-11-19 17:50:05'),(2,1,'Memory Match','Match pairs of words with their translations','memory','🎴','emoji',1,'básico','{\"grid_size\": \"auto\", \"show_images\": false, \"max_attempts\": null, \"cards_visible_time\": 3, \"shuffle_on_mistake\": false}',80,150,8,16,'Find matching pairs of words and their meanings!','A1','2025-11-19 17:50:05'),(3,1,'Matching Game','Connect words with their correct translations','matching','🔗','emoji',1,'básico','{\"timed\": false, \"columns\": 2, \"shuffle\": true, \"auto_check\": false, \"show_lines\": true, \"time_limit\": 300}',80,120,6,12,'Draw lines to connect each word with its correct meaning!','A1','2025-11-19 17:50:05'),(4,1,'Fill in the Blanks','Complete sentences with the correct words','fill_blanks','✏️','emoji',1,'básico','{\"show_hints\": true, \"case_sensitive\": false, \"show_word_bank\": true, \"sentence_complexity\": \"simple\", \"auto_generate_sentences\": true}',100,150,8,15,'Complete the sentences using the words from the word bank!','A1','2025-11-19 17:50:05'),(5,1,'Multiple Choice Quiz','Choose the correct translation from multiple options','multiple_choice','📋','emoji',1,'básico','{\"allow_skip\": false, \"options_count\": 4, \"show_feedback\": true, \"randomize_options\": true, \"time_per_question\": 30}',80,120,10,20,'Select the correct answer from the options provided!','A1','2025-11-19 17:50:05'),(6,1,'Flashcards','Study vocabulary with interactive flashcards','flashcards','🃏','emoji',1,'básico','{\"shuffle\": true, \"auto_advance\": false, \"flip_on_click\": true, \"show_progress\": true, \"swipe_enabled\": true}',80,100,10,30,'Click to flip the cards and learn new vocabulary!','A1','2025-11-19 17:50:05'),(7,1,'Word Search','Find hidden words in a grid of letters','word_search','🔍','emoji',1,'básico','{\"grid_size\": \"15x15\", \"directions\": [\"horizontal\", \"vertical\", \"diagonal\"], \"time_limit\": 600, \"show_word_list\": true}',80,120,10,20,'Find all the words hidden in the puzzle!','A1','2025-11-19 17:50:05'),(8,1,'Crossword Puzzle','Solve a crossword using word definitions','crossword','📰','emoji',1,'básico','{\"grid_size\": \"auto\", \"difficulty\": \"medium\", \"allow_hints\": true, \"numbered_cells\": true, \"show_definitions\": true}',120,180,8,15,'Fill in the crossword using the clues provided!','A1','2025-11-19 17:50:05'),(9,1,'Spelling Challenge','Listen and spell words correctly','spelling','🎧','emoji',1,'básico','{\"show_hints\": false, \"audio_enabled\": true, \"case_sensitive\": false, \"attempts_per_word\": 3, \"pronunciation_speed\": \"normal\"}',100,150,10,20,'Listen carefully and spell the words correctly!','A1','2025-11-19 17:50:05'),(10,1,'Sentence Builder','Build correct sentences using given words','sentence_builder','🏗️','emoji',1,'básico','{\"word_pool\": \"auto\", \"difficulty\": \"medium\", \"allow_hints\": true, \"check_order\": true, \"show_translation\": false}',100,150,5,10,'Arrange the words to build correct sentences!','A1','2025-11-19 17:50:05');
/*!40000 ALTER TABLE `juegos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `niveles_educativos`
--

DROP TABLE IF EXISTS `niveles_educativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `niveles_educativos` (
  `id_nivel` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `orden` int NOT NULL DEFAULT '0',
  `creado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nivel`),
  UNIQUE KEY `uq_niveles_nombre` (`nombre`),
  UNIQUE KEY `uq_niveles_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `niveles_educativos`
--

LOCK TABLES `niveles_educativos` WRITE;
/*!40000 ALTER TABLE `niveles_educativos` DISABLE KEYS */;
INSERT INTO `niveles_educativos` VALUES (1,'Técnico Superior Universitario','TSU',1,1,'2025-11-14 17:53:11','2025-11-14 17:53:11'),(2,'Ingeniería/Licenciatura','ING/LIC',1,2,'2025-11-14 17:53:11','2025-11-14 17:53:11');
/*!40000 ALTER TABLE `niveles_educativos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programas_educativos`
--

DROP TABLE IF EXISTS `programas_educativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programas_educativos` (
  `id_programa` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `orden` int NOT NULL DEFAULT '0',
  `creado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_programa`),
  UNIQUE KEY `uq_programas_nombre` (`nombre`),
  UNIQUE KEY `uq_programas_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programas_educativos`
--

LOCK TABLES `programas_educativos` WRITE;
/*!40000 ALTER TABLE `programas_educativos` DISABLE KEYS */;
INSERT INTO `programas_educativos` VALUES (1,'Tecnologías de la Información e Innovación Digital','TIC',1,1,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(2,'Negocios y Mercadotecnia','NyM',1,2,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(3,'Contaduría','CON',1,3,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(4,'Terapia Física','TF',1,4,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(5,'Terapia Física Área Rehabilitación','TFR',1,5,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(6,'Criminalistíca y ciencias Forences','CyCF',1,6,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(7,'Criminalistíca','CRI',1,7,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(8,'Diseño Digital y Producción Audiovisual','DDyPA',1,8,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(9,'Energía y Desarrollo Sostenible','EyDS',1,9,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(10,'Enfermería','ENF',1,10,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(11,'Industrial','IND',1,11,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(12,'Mecarónica','MEC',1,12,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(13,'Médico Cirujano y Partero','MCyP',1,13,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(14,'Nanotecnología','NAN',1,14,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(15,'Salud Reproductiva y Partería','SRyP',1,15,'2025-11-14 17:52:29','2025-11-14 17:52:29'),(16,'Ambiental y Sustentabilidad','AyS',1,16,'2025-11-14 17:52:29','2025-11-14 17:52:29');
/*!40000 ALTER TABLE `programas_educativos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resultados`
--

DROP TABLE IF EXISTS `resultados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resultados` (
  `id_resultado` int NOT NULL AUTO_INCREMENT,
  `id_alumno_resultado_fk` int DEFAULT NULL,
  `id_actividad_resultado_fk` int DEFAULT NULL,
  `intento_numero` int DEFAULT '1',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `puntaje` int DEFAULT '0',
  `experiencia_ganada` int DEFAULT '0',
  `palabras_correctas` int DEFAULT '0',
  `palabras_incorrectas` int DEFAULT '0',
  `palabras_totales` int DEFAULT '0',
  `porcentaje_acierto` decimal(5,2) DEFAULT '0.00',
  `aciertos` int DEFAULT '0',
  `errores` int DEFAULT '0',
  `tiempo_segundos` int DEFAULT '0',
  `completado` tinyint(1) DEFAULT '0',
  `aprobado` tinyint(1) DEFAULT '0',
  `calificacion` decimal(5,2) DEFAULT NULL,
  `pistas_usadas` int DEFAULT '0',
  `datos_juego` json DEFAULT NULL,
  `errores_detallados` json DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resultado`),
  KEY `id_alumno_resultado_fk` (`id_alumno_resultado_fk`),
  KEY `id_actividad_resultado_fk` (`id_actividad_resultado_fk`),
  KEY `idx_aprobado` (`aprobado`),
  KEY `idx_porcentaje` (`porcentaje_acierto`),
  KEY `idx_intento` (`intento_numero`),
  CONSTRAINT `resultados_ibfk_1` FOREIGN KEY (`id_alumno_resultado_fk`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE,
  CONSTRAINT `resultados_ibfk_2` FOREIGN KEY (`id_actividad_resultado_fk`) REFERENCES `actividades` (`id_actividad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resultados`
--

LOCK TABLES `resultados` WRITE;
/*!40000 ALTER TABLE `resultados` DISABLE KEYS */;
/*!40000 ALTER TABLE `resultados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_error`
--

DROP TABLE IF EXISTS `tipos_error`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_error` (
  `id_tipo_error` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_tipo_error`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_error`
--

LOCK TABLES `tipos_error` WRITE;
/*!40000 ALTER TABLE `tipos_error` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipos_error` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primer_apellido` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `segundo_apellido` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contrasena` text COLLATE utf8mb4_unicode_ci,
  `rol` enum('administrador','docente','alumno') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Prueba','Test','User','prueba638979625715687339@example.com','password123','administrador',1,'2025-11-05 18:02:51'),(2,'Prueba2','Test2','User2','prueba2638981327152051429@example.com','password12345','administrador',1,'2025-11-07 17:18:35'),(3,'Jonathan','Serrano','Ortiz','1723110233a@utectulancingo.edu.mx','86e53c83fb279aec2a94d16a55da4b17:fae6cc597f54191179edd18e88af502d94f945d065c38eb85af28211b9c1bedf4a515b5f0c3c7c0a7765634640e3c988d4aac94dcea3fdc9b3194e3d79b5c179','administrador',1,'2025-11-11 00:59:16'),(5,'Jonathan','Serrano','Ortiz','crunkin656@gmail.com','cfd29663043be2ad18d6e96514b2de0e:93753a3e42b50ff7a369791d4645681564a62447f213a59b21eb763c5841a60576f648b26c6f0a515f7f2e3782090109aa035abb8e0dc0b289ba5578345a670c','docente',1,'2025-11-11 23:28:35'),(6,'Diana Yamileika','Tellez','Ordoñez','1723110200@utectulancingo.edu.mx','garritas','administrador',1,'2025-11-14 01:56:38'),(7,'Diego Alexis','Guerrero','Rosas','1723110020@utectulancingo.edu.mx','0dd2daac257fcc51877e0e2f1cd797f7:ecfa3117d51d1d8632a1298281357b9facea56b1137ff459a3527faa9d310bd2483ef18120c330f1125bf91284466f2df913efb153cedc5fff2ef5d6b4756802','docente',1,'2025-11-14 16:30:40'),(8,'Marcos','Rodrigues','Ramirez','1723110457@utectulacingo.edu.mx','60f59784ff5722b5690ba772b75a5e89:3529b06895f1c294798b64d09781bd404e02054548fe4360210820a4017b263259a26bd425cfcaf2a284098e0e8d6d3489ce6b8244859f89a980e024703d77cb','docente',1,'2025-11-14 16:44:37'),(9,'Maria','Sanchez','Días','1723110276@utectulancingo.edu.mx','d94a0aed2725d95eaf5c22d37a223121:0680db6d123e1f2b315aeb604e7e5dc8eeb4835101e959d8f0c809596463d2822c154f3893bcc6be095c234e7ab80bfa9115df42ed3571d40788a4c9decd55ac','docente',1,'2025-11-14 16:51:38'),(10,'Maria','Soberanes','García','1723110513@utectulancingo.edu.mx','f381a688851909c3014a72dee59e5518:21f46d70cd5b4713f80e1f68fe5e0abdd6b16572f5b5a119ab689e19922b1e69ca20dae9bbb756a66d54518a16c4e3d1c3cf21d05bbd3da5404a23477d931d0c','alumno',1,'2025-11-15 21:58:47'),(11,'Karen','Silva','Guerrero','1723110657@utectulancingo.edu.mx','9f10aa76094f138d48a1de7b672391db:b258a98fa368e24e2e8264b12a2d7a06184b8aeb385bd6b47f976cb797beb005784bd7ce8c329ec0ddf470eefdbeacb174631c85e786975942beba8682555e58','alumno',1,'2025-11-17 23:31:22'),(12,'Jazmín','Ledezma','Días','1723110044@utectulancingo.edu.mx','58d0f7670373d67f85b6e36a6003326e:7b9af576a9aa8ea52c34f5786abe8601388467eefcbcbf93c3cbbeaf965ffb0cbc7ca768a848f94be9b5ad9e283d2a03db74b1b6774971beafe268bced5fcaa3','alumno',1,'2025-11-17 23:34:03'),(13,'Samuel','Samperio','Islas','1723110777@utectulancingo.edu.mx','371c851787147791e1941c0eec74ca6e:5a454fa49a46ff3f877c72dde7828694f2e3f3ceadd886fbebf396ebc208d46aafe6b85dbd1733965df5782b29e800d614cfd58d8835a9478b69473880390770','alumno',1,'2025-11-17 23:34:52'),(14,'Gabriel','Sánchez','Girón','1723110986@utectulancingo.edu.mx','13ce82d3c7482f4ce1bea5455757eeb0:321ef6476576e13f4f57f33b1640c244f6008e6bd61edcf44779e07d6c8ebc1403053dd5826b1cd709b8340c877bb072d3219ea69843f7d04f1ebb3b96f7879c','alumno',1,'2025-11-17 23:36:06'),(15,'Pablo','Gutiérrez','Ortiz','1723110321@utectulancingo.edu.mx','2bb469834b7230843000bc57800c0368:25040c6cd2917d86f4682b7cf91e77875c3bc6256ad8d5982711337c21e4449e4c977824f8c780c72dc418affc90e28d9c2072a971ac26b4b5bb6666c06bff6b','alumno',1,'2025-11-17 23:37:02'),(16,'Mario','Bros','Nintendo','1723110555@utectulancingo.edu.mx','c8d87fcfc7c5390ee00c25874c612d4e:5f3fc7a781c1b0a0d0c02dda57e5472ba697b54efe9f9b9cbd0fbb4680baa5ea3b478e21d37f57c0ee876fc8b72144c9818e0aaab25121c329a06d6053995dec','alumno',1,'2025-11-17 23:38:12'),(17,'María','Velázquez','Amador','1723110051@utectulancingo.edu.mx','3f503893ee404c5a3a2acfce880412a4:827ab4ed710b7fbcc30f3659f364800bf2c31cb7a4bdd48e187fec92e5a21ec40c36c5fa8b2c58122af9ebf0c898cf7c0ec55a978b3727017cb65dc132a6015c','alumno',1,'2025-11-17 23:39:20'),(18,'Juan','Samperio','Barragán','1723110889@utectulancingo.edu.mx','1dc5393196d0414bab1dff43eb3bd0eb:485eed66f3796bd07e4c320a563abcf590300c7689e0c4ae53e5d99657d9514bc512a39b182ec44b39491ac508da974ea081ff96a57a0ca1e7be2501a7a14e2c','alumno',1,'2025-11-17 23:40:02'),(19,'Ángel','Ortega','Blancas','1723110312@utectulancingo.edu.mx','3d11510198383d804b4062b1919fa229:7e873d98fd4d9af5e94dd09af5ad1d243340bc96df8c6e965c86fba3663514693eda9bdb6f83fb155bf2cd0e12380856d4f71c6ff4d952dcf6224d64d30fe775','alumno',1,'2025-11-17 23:41:14'),(20,'jaja','jaja','jaja','jaj@utectulancingo.edu.mx','46758d44d933e480676fde437c5b1ed1:8e65b22dddae082a31487d2ea0096a12f845869363cb501ff42279394dd08076529fce827cb3b0f5aa4a80cdded36ff5cc36dd4f7a9f0fafe3c54a9762908b01','alumno',1,'2025-11-17 23:45:01'),(21,'Prueba','Prueba','prueba','1723110545@utectulancingo.edu.mx','05801fa5a4ed3d566d6456af545cc013:5331f209fbb42db7bdacff671593618efa6b523db028edfa86d4e9caa619b238c51742b88e43e800e504797a1e51b95a9562bd74f216324fdd53a50469580053','alumno',1,'2025-11-18 20:15:12'),(22,'Jorge','El','Curioso','1723110447@utectulancingo.edu.mx','81de766aa113b73ce8e0b2666788d057:7025f7702e356bb3fa5ae461dddcd5b7bceaf44bd26c440261f205d7b6a125370e971bd79991c0dbe5e0ed994ef9404a589b2e559f316fd69e4d9dcc71cb54e1','alumno',1,'2025-11-19 21:20:49'),(23,'Víctor Adrián','Montaño','Jiménez','1723110979@utectulancingo.edu.mx','f37bfbc80e21827a3bf85c5de37b5d42:bfc67e675f48d532adcd594afc22b70caf1949f53dacff05fb25132aac4fe003c9db1c9dff5ff6569f30594137a1578e5e8cfe78d71eb57bd98a88fc80e71e7b','docente',1,'2025-11-19 21:23:57');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vocabulario`
--

DROP TABLE IF EXISTS `vocabulario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vocabulario` (
  `id_vocabulario` int NOT NULL AUTO_INCREMENT,
  `id_juego_vocabulario_fk` int DEFAULT NULL,
  `nivel` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Educational level (A1, A2, B1, etc.)',
  `contenido` json DEFAULT NULL COMMENT 'Vocabulary entries array [{palabra, significado, nivel}]',
  `archivo_original` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Original PDF filename',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_vocabulario`),
  KEY `id_juego_vocabulario_fk` (`id_juego_vocabulario_fk`),
  KEY `idx_nivel` (`nivel`),
  CONSTRAINT `vocabulario_ibfk_1` FOREIGN KEY (`id_juego_vocabulario_fk`) REFERENCES `juegos` (`id_juego`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vocabulario`
--

LOCK TABLES `vocabulario` WRITE;
/*!40000 ALTER TABLE `vocabulario` DISABLE KEYS */;
INSERT INTO `vocabulario` VALUES (8,NULL,'A1','[{\"nombre\": \"Wild animals, parts of animals\' bodies, farm animals\", \"numero\": 5, \"subunits\": [{\"nombre\": \"Birds of a feather\", \"numero\": \"5a\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"beak\", \"significado\": \"the hard part of a bird\'s mouth\"}, {\"nivel\": \"A1\", \"palabra\": \"bear\", \"significado\": \"a large wild animal with thick fur\"}, {\"nivel\": \"A1\", \"palabra\": \"claw\", \"significado\": \"sharp nail at the end of an animal\'s toe\"}, {\"nivel\": \"A1\", \"palabra\": \"coast\", \"significado\": \"land next to the sea\"}, {\"nivel\": \"A1\", \"palabra\": \"crocodile\", \"significado\": \"a large reptile with sharp teeth, short legs and a long tail that lives in water\"}, {\"nivel\": \"A1\", \"palabra\": \"dolphin\", \"significado\": \"a sea mammal that has a pointed mouth\"}, {\"nivel\": \"A1\", \"palabra\": \"eagle\", \"significado\": \"a big bird with very large wings\"}, {\"nivel\": \"A1\", \"palabra\": \"easily\", \"significado\": \"without trying hard\"}, {\"nivel\": \"A1\", \"palabra\": \"elephant\", \"significado\": \"a large animal with a long nose\"}, {\"nivel\": \"A1\", \"palabra\": \"feather\", \"significado\": \"the soft covering of a bird\'s body\"}, {\"nivel\": \"A1\", \"palabra\": \"feed on\", \"significado\": \"to eat\"}, {\"nivel\": \"A1\", \"palabra\": \"fin\", \"significado\": \"the thin part on the side or top of a fish and other marine creatures\"}, {\"nivel\": \"A1\", \"palabra\": \"flamingo\", \"significado\": \"a bird with pink feathers and very long legs\"}, {\"nivel\": \"A1\", \"palabra\": \"friendly\", \"significado\": \"sociable and kind\"}, {\"nivel\": \"A1\", \"palabra\": \"funny\", \"significado\": \"comical, humorous\"}, {\"nivel\": \"A1\", \"palabra\": \"fur\", \"significado\": \"the thick soft hair that covers animals\' bodies\"}, {\"nivel\": \"A1\", \"palabra\": \"giraffe\", \"significado\": \"a large African animal with a long neck\"}, {\"nivel\": \"A1\", \"palabra\": \"ice\", \"significado\": \"frozen water\"}, {\"nivel\": \"A1\", \"palabra\": \"intelligent\", \"significado\": \"very clever\"}, {\"nivel\": \"A1\", \"palabra\": \"kayak tour\", \"significado\": \"an organised activity on narrow boats with paddles\"}, {\"nivel\": \"A1\", \"palabra\": \"lay eggs\", \"significado\": \"(of an animal) to produce eggs from the body\"}, {\"nivel\": \"A1\", \"palabra\": \"lion\", \"significado\": \"a big powerful cat\"}, {\"nivel\": \"A1\", \"palabra\": \"mammal\", \"significado\": \"an animal that has babies, not eggs\"}, {\"nivel\": \"A1\", \"palabra\": \"mane\", \"significado\": \"the long hair growing on a male lion\'s or horse\'s head\"}, {\"nivel\": \"A1\", \"palabra\": \"monkey\", \"significado\": \"a small clever mammal in the same family as humans\"}, {\"nivel\": \"A1\", \"palabra\": \"neck\", \"significado\": \"the part of the body that joins the head to the rest of the body\"}, {\"nivel\": \"A1\", \"palabra\": \"offer\", \"significado\": \"to give sth\"}, {\"nivel\": \"A1\", \"palabra\": \"paw\", \"significado\": \"the foot of an animal (e.g. a dog, cat, bear)\"}, {\"nivel\": \"A1\", \"palabra\": \"penguin\", \"significado\": \"a sea bird that cannot fly and lives in very cold areas\"}, {\"nivel\": \"A1\", \"palabra\": \"protect\", \"significado\": \"to keep sb or sth safe\"}, {\"nivel\": \"A1\", \"palabra\": \"reptile\", \"significado\": \"a cold-blooded animal that lays eggs\"}, {\"nivel\": \"A1\", \"palabra\": \"reserve\", \"significado\": \"an area where the animals are protected\"}, {\"nivel\": \"A1\", \"palabra\": \"sharp\", \"significado\": \"having a point at the end that can scratch or cut sb or sth\"}, {\"nivel\": \"A1\", \"palabra\": \"smile\", \"significado\": \"an expression in which the corners of our mouth turn up to show friendliness or happiness\"}, {\"nivel\": \"A1\", \"palabra\": \"smile\", \"significado\": \"to turn up your mouth to show you are happy\"}, {\"nivel\": \"A1\", \"palabra\": \"snake\", \"significado\": \"a long thin reptile without legs\"}, {\"nivel\": \"A1\", \"palabra\": \"stripe\", \"significado\": \"a line\"}, {\"nivel\": \"A1\", \"palabra\": \"tail\", \"significado\": \"the part of an animal\'s body that sticks out from the back end\"}, {\"nivel\": \"A1\", \"palabra\": \"thick\", \"significado\": \"not thin\"}, {\"nivel\": \"A1\", \"palabra\": \"tiger\", \"significado\": \"a wild animal like a cat with striped fur\"}, {\"nivel\": \"A1\", \"palabra\": \"trunk\", \"significado\": \"the long nose of an elephant\"}, {\"nivel\": \"A1\", \"palabra\": \"unusual\", \"significado\": \"strange\"}, {\"nivel\": \"A1\", \"palabra\": \"warm\", \"significado\": \"not hot or cold\"}, {\"nivel\": \"A1\", \"palabra\": \"weigh\", \"significado\": \"to have a particular weight, e.g. three kilos\"}, {\"nivel\": \"A1\", \"palabra\": \"welcome\", \"significado\": \"to greet sb in a friendly way\"}, {\"nivel\": \"A1\", \"palabra\": \"whisker\", \"significado\": \"each of the long hairs that grow on an animal\'s face, around its mouth\"}, {\"nivel\": \"A1\", \"palabra\": \"wild\", \"significado\": \"(of an animal) living in nature\"}, {\"nivel\": \"A1\", \"palabra\": \"wing\", \"significado\": \"a part of the body of some animals that they use for flying\"}, {\"nivel\": \"A1\", \"palabra\": \"zebra\", \"significado\": \"a wild animal with black stripes that looks like a horse\"}]}, {\"nombre\": \"Grammar in Use\", \"numero\": \"5b\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"acre\", \"significado\": \"4,047 square metres\"}, {\"nivel\": \"A1\", \"palabra\": \"carry\", \"significado\": \"to hold sth and move it from one place to another\"}, {\"nivel\": \"A1\", \"palabra\": \"continent\", \"significado\": \"each of the main areas of land on Earth, e.g. Asia, Africa, Europe, America, Oceania\"}, {\"nivel\": \"A1\", \"palabra\": \"entrance fee\", \"significado\": \"the money you pay in order to go in a building and see an event, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"explore\", \"significado\": \"to go around to find out more about a place\"}, {\"nivel\": \"A1\", \"palabra\": \"feed\", \"significado\": \"to give food to a person or animal\"}, {\"nivel\": \"A1\", \"palabra\": \"grant a request\", \"significado\": \"to allow sb to do sth after he/she has asked you to do it\"}, {\"nivel\": \"A1\", \"palabra\": \"hide\", \"significado\": \"to remain unseen\"}, {\"nivel\": \"A1\", \"palabra\": \"pick up\", \"significado\": \"to lift sth up\"}, {\"nivel\": \"A1\", \"palabra\": \"pouch\", \"significado\": \"a pocket of skin where some animals carry their babies\"}, {\"nivel\": \"A1\", \"palabra\": \"preserve\", \"significado\": \"an area where wild animals and plants are protected\"}, {\"nivel\": \"A1\", \"palabra\": \"species\", \"significado\": \"a group of animals of the same kind\"}, {\"nivel\": \"A1\", \"palabra\": \"stripe\", \"significado\": \"a line\"}, {\"nivel\": \"A1\", \"palabra\": \"tank\", \"significado\": \"a large container with water\"}, {\"nivel\": \"A1\", \"palabra\": \"tongue\", \"significado\": \"the movable organ in the mouth\"}, {\"nivel\": \"A1\", \"palabra\": \"zookeeper\", \"significado\": \"sb who works in a zoo and protects the animals\"}]}, {\"nombre\": \"Skills in Action\", \"numero\": \"5c\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"application form\", \"significado\": \"a paper that we complete to take part in sth or ask for sth, e.g. a job\"}, {\"nivel\": \"A1\", \"palabra\": \"cow\", \"significado\": \"a large farm animal that gives us milk\"}, {\"nivel\": \"A1\", \"palabra\": \"donkey\", \"significado\": \"an animal with long ears that looks like a horse\"}, {\"nivel\": \"A1\", \"palabra\": \"duck\", \"significado\": \"a small bird with a short neck and legs\"}, {\"nivel\": \"A1\", \"palabra\": \"farm animal\", \"significado\": \"each of the animals that live on a farm, e.g. cows, chickens, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"goat\", \"significado\": \"an animal with horns that we keep for its milk and meat\"}, {\"nivel\": \"A1\", \"palabra\": \"goose\", \"significado\": \"a water bird like a duck\"}, {\"nivel\": \"A1\", \"palabra\": \"hen\", \"significado\": \"a female chicken\"}, {\"nivel\": \"A1\", \"palabra\": \"horse\", \"significado\": \"a large animal that people can ride on\"}, {\"nivel\": \"A1\", \"palabra\": \"interested in\", \"significado\": \"giving a lot of attention to\"}, {\"nivel\": \"A1\", \"palabra\": \"quite\", \"significado\": \"rather\"}, {\"nivel\": \"A1\", \"palabra\": \"retired\", \"significado\": \"sb who does not work anymore because of old age\"}, {\"nivel\": \"A1\", \"palabra\": \"rooster\", \"significado\": \"a male chicken\"}, {\"nivel\": \"A1\", \"palabra\": \"sheep\", \"significado\": \"a farm animal that gives us meat and wool\"}, {\"nivel\": \"A1\", \"palabra\": \"turkey\", \"significado\": \"a large bird that looks like a chicken\"}, {\"nivel\": \"A1\", \"palabra\": \"volunteer\", \"significado\": \"to work for an organisation without pay\"}, {\"nivel\": \"A1\", \"palabra\": \"beaver\", \"significado\": \"an animal that lives in rivers and has a wide flat tail which helps it swim and make its home\"}, {\"nivel\": \"A1\", \"palabra\": \"bill\", \"significado\": \"the hard part of a bird\'s mouth\"}, {\"nivel\": \"A1\", \"palabra\": \"cute\", \"significado\": \"sweet\"}, {\"nivel\": \"A1\", \"palabra\": \"eucalyptus\", \"significado\": \"a plant eaten by koalas\"}, {\"nivel\": \"A1\", \"palabra\": \"fluffy\", \"significado\": \"soft and like wool or fur\"}, {\"nivel\": \"A1\", \"palabra\": \"ground\", \"significado\": \"the surface of the earth\"}, {\"nivel\": \"A1\", \"palabra\": \"home to\", \"significado\": \"the habitat of\"}, {\"nivel\": \"A1\", \"palabra\": \"hop\", \"significado\": \"to jump\"}, {\"nivel\": \"A1\", \"palabra\": \"male\", \"significado\": \"relating to a boy, a man or an animal that does not have babies\"}, {\"nivel\": \"A1\", \"palabra\": \"otter\", \"significado\": \"an animal like a seal\"}, {\"nivel\": \"A1\", \"palabra\": \"spoon\", \"significado\": \"a tool for eating soup, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"strange\", \"significado\": \"very unusual\"}, {\"nivel\": \"A1\", \"palabra\": \"unique\", \"significado\": \"very special; one of a kind\"}]}]}, {\"nombre\": \"Weather, seasons, months, activities clothes\", \"numero\": 6, \"subunits\": [{\"nombre\": \"Come rain or shine\", \"numero\": \"6a\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"ancient\", \"significado\": \"belonging to a time long ago in history\"}, {\"nivel\": \"A1\", \"palabra\": \"blow\", \"significado\": \"(of the air) to move\"}, {\"nivel\": \"A1\", \"palabra\": \"cloudy\", \"significado\": \"(of weather) with clouds in the sky\"}, {\"nivel\": \"A1\", \"palabra\": \"come rain or shine\", \"significado\": \"no matter what happens\"}, {\"nivel\": \"A1\", \"palabra\": \"dry\", \"significado\": \"not wet\"}, {\"nivel\": \"A1\", \"palabra\": \"fog\", \"significado\": \"a thick cloud of mist that makes it difficult to see\"}, {\"nivel\": \"A1\", \"palabra\": \"foggy\", \"significado\": \"when there is a thick cloud of mist that makes it difficult to see\"}, {\"nivel\": \"A1\", \"palabra\": \"freezing cold\", \"significado\": \"very cold\"}, {\"nivel\": \"A1\", \"palabra\": \"golden\", \"significado\": \"having a bright yellow colour\"}, {\"nivel\": \"A1\", \"palabra\": \"greetings\", \"significado\": \"hello\"}, {\"nivel\": \"A1\", \"palabra\": \"in fact\", \"significado\": \"in reality\"}, {\"nivel\": \"A1\", \"palabra\": \"inside\", \"significado\": \"in a room, building, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"luckily\", \"significado\": \"fortunately\"}, {\"nivel\": \"A1\", \"palabra\": \"rainy\", \"significado\": \"with a lot of rain\"}, {\"nivel\": \"A1\", \"palabra\": \"sail\", \"significado\": \"to travel across water in a boat\"}, {\"nivel\": \"A1\", \"palabra\": \"sand\", \"significado\": \"the very small pieces of rock on beaches or in deserts\"}, {\"nivel\": \"A1\", \"palabra\": \"sightsee\", \"significado\": \"to visit famous places\"}, {\"nivel\": \"A1\", \"palabra\": \"snow\", \"significado\": \"(of snowflakes) to fall from the sky in winter\"}, {\"nivel\": \"A1\", \"palabra\": \"snowy\", \"significado\": \"full of snow\"}, {\"nivel\": \"A1\", \"palabra\": \"strange\", \"significado\": \"very unusual\"}, {\"nivel\": \"A1\", \"palabra\": \"sunny\", \"significado\": \"(of weather) with a lot of sun\"}, {\"nivel\": \"A1\", \"palabra\": \"temple\", \"significado\": \"a place of worship\"}, {\"nivel\": \"A1\", \"palabra\": \"warm\", \"significado\": \"not cold or hot\"}, {\"nivel\": \"A1\", \"palabra\": \"waterproof\", \"significado\": \"not allowing water to pass through\"}, {\"nivel\": \"A1\", \"palabra\": \"waterproof jacket\", \"significado\": \"a jacket that keeps out water\"}, {\"nivel\": \"A1\", \"palabra\": \"windy\", \"significado\": \"(of weather) with a strong wind blowing\"}]}, {\"nombre\": \"Grammar in Use\", \"numero\": \"6b\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"ASAP (as soon as possible)\", \"significado\": \"quickly\"}, {\"nivel\": \"A1\", \"palabra\": \"barbecue\", \"significado\": \"cooking and eating a meal outdoors\"}, {\"nivel\": \"A1\", \"palabra\": \"delicious\", \"significado\": \"very tasty\"}, {\"nivel\": \"A1\", \"palabra\": \"historic\", \"significado\": \"famous or important in history\"}, {\"nivel\": \"A1\", \"palabra\": \"jog\", \"significado\": \"to run slowly for exercise\"}, {\"nivel\": \"A1\", \"palabra\": \"monument\", \"significado\": \"an old building, structure or object that is historically important\"}, {\"nivel\": \"A1\", \"palabra\": \"pick sb up\", \"significado\": \"to collect sb (usually by car)\"}, {\"nivel\": \"A1\", \"palabra\": \"sunbathe\", \"significado\": \"to lie under the sun\"}]}, {\"nombre\": \"Skills in Action\", \"numero\": \"6c\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"belt\", \"significado\": \"a long piece of leather or cloth that you wear around the waist\"}, {\"nivel\": \"A1\", \"palabra\": \"blouse\", \"significado\": \"a piece of clothing that a woman wears on her upper body\"}, {\"nivel\": \"A1\", \"palabra\": \"boot\", \"significado\": \"a type of strong shoe\"}, {\"nivel\": \"A1\", \"palabra\": \"cap\", \"significado\": \"a small hat\"}, {\"nivel\": \"A1\", \"palabra\": \"coat\", \"significado\": \"a long piece of clothing that keeps you warm outdoors\"}, {\"nivel\": \"A1\", \"palabra\": \"crowded\", \"significado\": \"full of people\"}, {\"nivel\": \"A1\", \"palabra\": \"dress\", \"significado\": \"a piece of clothing for women that covers the whole body\"}, {\"nivel\": \"A1\", \"palabra\": \"glove\", \"significado\": \"an item of clothing that you wear on your hand\"}, {\"nivel\": \"A1\", \"palabra\": \"guide\", \"significado\": \"a person that shows tourists around a place\"}, {\"nivel\": \"A1\", \"palabra\": \"hat\", \"significado\": \"a covering for the head\"}, {\"nivel\": \"A1\", \"palabra\": \"high\", \"significado\": \"heeled (adj): a type of tall shoe that women wear\"}, {\"nivel\": \"A1\", \"palabra\": \"island\", \"significado\": \"an area of land surrounded by water\"}, {\"nivel\": \"A1\", \"palabra\": \"item\", \"significado\": \"an object or thing, usually of a collection\"}, {\"nivel\": \"A1\", \"palabra\": \"jacket\", \"significado\": \"a short coat\"}, {\"nivel\": \"A1\", \"palabra\": \"jeans\", \"significado\": \"a pair of denim trousers\"}, {\"nivel\": \"A1\", \"palabra\": \"medium\", \"significado\": \"middle in size\"}, {\"nivel\": \"A1\", \"palabra\": \"postcode\", \"significado\": \"the numbers and/or letters at the end of an address\"}, {\"nivel\": \"A1\", \"palabra\": \"refund\", \"significado\": \"money that a shop gives to a customer who returns an unwanted item\"}, {\"nivel\": \"A1\", \"palabra\": \"sandal\", \"significado\": \"a type of flat shoe that people wear in the summer\"}, {\"nivel\": \"A1\", \"palabra\": \"scarf\", \"significado\": \"clothing that you wear around your neck to keep you warm\"}, {\"nivel\": \"A1\", \"palabra\": \"seaside\", \"significado\": \"coastal\"}, {\"nivel\": \"A1\", \"palabra\": \"serve\", \"significado\": \"to give food or drink, e.g. at a restaurant, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"shirt\", \"significado\": \"a long-sleeved top with buttons\"}, {\"nivel\": \"A1\", \"palabra\": \"shorts\", \"significado\": \"a pair of short trousers\"}, {\"nivel\": \"A1\", \"palabra\": \"size\", \"significado\": \"a set measurement for clothes\"}, {\"nivel\": \"A1\", \"palabra\": \"skirt\", \"significado\": \"a piece of clothing for women that hangs from the waist\"}, {\"nivel\": \"A1\", \"palabra\": \"sock\", \"significado\": \"a piece of clothing for the foot\"}, {\"nivel\": \"A1\", \"palabra\": \"suit\", \"significado\": \"a jacket and trousers\"}, {\"nivel\": \"A1\", \"palabra\": \"tie\", \"significado\": \"a long piece of cloth that men wear around the neck\"}, {\"nivel\": \"A1\", \"palabra\": \"tight\", \"significado\": \"closely fitting your body and sometimes uncomfortable\"}, {\"nivel\": \"A1\", \"palabra\": \"tights\", \"significado\": \"a piece of clothing of thin material that a woman wears to cover her legs\"}, {\"nivel\": \"A1\", \"palabra\": \"top\", \"significado\": \"a piece of clothing for the upper part of your body, usually for women\"}, {\"nivel\": \"A1\", \"palabra\": \"trainers\", \"significado\": \"sports shoes\"}, {\"nivel\": \"A1\", \"palabra\": \"trousers\", \"significado\": \"a piece of clothing for men and women that covers the legs\"}, {\"nivel\": \"A1\", \"palabra\": \"California\", \"significado\": \"a state on the west coast of the USA\"}, {\"nivel\": \"A1\", \"palabra\": \"cool\", \"significado\": \"not very cold, at a low temperature\"}, {\"nivel\": \"A1\", \"palabra\": \"desert\", \"significado\": \"a large area of land with almost no water or trees\"}, {\"nivel\": \"A1\", \"palabra\": \"foggy\", \"significado\": \"when there is a thick cloud of mist that makes it difficult to see\"}, {\"nivel\": \"A1\", \"palabra\": \"jumper\", \"significado\": \"a warm soft top with long sleeves\"}, {\"nivel\": \"A1\", \"palabra\": \"pack\", \"significado\": \"to put things in a bag or suitcase before travelling\"}, {\"nivel\": \"A1\", \"palabra\": \"protection\", \"significado\": \"safety\"}, {\"nivel\": \"A1\", \"palabra\": \"size\", \"significado\": \"how big or small sth is\"}, {\"nivel\": \"A1\", \"palabra\": \"wet\", \"significado\": \"(of weather) rainy\"}]}]}, {\"nombre\": \"Types of foods, drinks, clutery / tableware, ways to cook; food preparation verbs\", \"numero\": 7, \"subunits\": [{\"nombre\": \"Taste the world\", \"numero\": \"7a\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"apple pie\", \"significado\": \"a tart made from apples and pastry\"}, {\"nivel\": \"A1\", \"palabra\": \"beef\", \"significado\": \"meat from a cow\"}, {\"nivel\": \"A1\", \"palabra\": \"biscuit\", \"significado\": \"a small flat sweet cake\"}, {\"nivel\": \"A1\", \"palabra\": \"bowl\", \"significado\": \"a round container for serving soup, salads, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"bread\", \"significado\": \"a food that we make from flour and water and bake in an oven\"}, {\"nivel\": \"A1\", \"palabra\": \"breakfast\", \"significado\": \"the first meal of the day\"}, {\"nivel\": \"A1\", \"palabra\": \"butter\", \"significado\": \"a soft, white or yellow food that we make from milk\"}, {\"nivel\": \"A1\", \"palabra\": \"cabbage\", \"significado\": \"a large round vegetable with thick leaves\"}, {\"nivel\": \"A1\", \"palabra\": \"cereal\", \"significado\": \"a breakfast food that we make from corn or grain\"}, {\"nivel\": \"A1\", \"palabra\": \"cheese\", \"significado\": \"a yellow or white, hard or soft type of food that we make from milk\"}, {\"nivel\": \"A1\", \"palabra\": \"cherry\", \"significado\": \"a small, juicy, red fruit that grows on trees\"}, {\"nivel\": \"A1\", \"palabra\": \"chicken\", \"significado\": \"the meat of a bird that lives on a farm\"}, {\"nivel\": \"A1\", \"palabra\": \"chocolate cake\", \"significado\": \"a cake that we make using chocolate\"}, {\"nivel\": \"A1\", \"palabra\": \"choice\", \"significado\": \"selection\"}, {\"nivel\": \"A1\", \"palabra\": \"chopsticks\", \"significado\": \"a pair of thin sticks that people in China and the Far East use to eat\"}, {\"nivel\": \"A1\", \"palabra\": \"coconut\", \"significado\": \"a tropical fruit\"}, {\"nivel\": \"A1\", \"palabra\": \"crab\", \"significado\": \"a sea creature with a shell and ten legs\"}, {\"nivel\": \"A1\", \"palabra\": \"cuisine\", \"significado\": \"a style of food\"}, {\"nivel\": \"A1\", \"palabra\": \"culture\", \"significado\": \"the lifestyle, tradition, history, arts, etc of a country\"}, {\"nivel\": \"A1\", \"palabra\": \"cutlery\", \"significado\": \"knives, forks and spoons\"}, {\"nivel\": \"A1\", \"palabra\": \"dairy\", \"significado\": \"types of food that we make from milk, e.g. cheese, yoghurt, butter, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"dessert\", \"significado\": \"a sweet that you usually eat after a meal\"}, {\"nivel\": \"A1\", \"palabra\": \"dip\", \"significado\": \"to put sth into a liquid for a short time\"}, {\"nivel\": \"A1\", \"palabra\": \"drink\", \"significado\": \"a liquid for drinking\"}, {\"nivel\": \"A1\", \"palabra\": \"fish\", \"significado\": \"an animal that lives in water and people eat as food\"}, {\"nivel\": \"A1\", \"palabra\": \"food\", \"significado\": \"the things that people and animals eat\"}, {\"nivel\": \"A1\", \"palabra\": \"fork\", \"significado\": \"an object that you use to pick up and eat your food\"}, {\"nivel\": \"A1\", \"palabra\": \"fruit\", \"significado\": \"an apple, an orange, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"garlic\", \"significado\": \"a small white vegetable with a very strong taste and smell\"}, {\"nivel\": \"A1\", \"palabra\": \"grain\", \"significado\": \"seeds as food\"}, {\"nivel\": \"A1\", \"palabra\": \"grape\", \"significado\": \"a green or purple berry\"}, {\"nivel\": \"A1\", \"palabra\": \"hungry\", \"significado\": \"feeling the need to eat\"}, {\"nivel\": \"A1\", \"palabra\": \"ice cream\", \"significado\": \"a cold sweet that we make from milk\"}, {\"nivel\": \"A1\", \"palabra\": \"ingredient\", \"significado\": \"each of the things that we use to make a dish\"}, {\"nivel\": \"A1\", \"palabra\": \"insulting\", \"significado\": \"rude, offensive\"}, {\"nivel\": \"A1\", \"palabra\": \"ketchup\", \"significado\": \"tomato sauce\"}, {\"nivel\": \"A1\", \"palabra\": \"knife\", \"significado\": \"a tool for cutting food\"}, {\"nivel\": \"A1\", \"palabra\": \"lamb\", \"significado\": \"the meat of a young sheep\"}, {\"nivel\": \"A1\", \"palabra\": \"lettuce\", \"significado\": \"a leafy green vegetable that people use in salads\"}, {\"nivel\": \"A1\", \"palabra\": \"light\", \"significado\": \"not heavy; (of food) in a small quantity\"}, {\"nivel\": \"A1\", \"palabra\": \"meal\", \"significado\": \"breakfast, lunch or dinner\"}, {\"nivel\": \"A1\", \"palabra\": \"meat\", \"significado\": \"the parts of animals that we use for food\"}, {\"nivel\": \"A1\", \"palabra\": \"milk\", \"significado\": \"what we get from cows or goats and drink\"}, {\"nivel\": \"A1\", \"palabra\": \"mustard\", \"significado\": \"a type of yellow sauce, usually eaten with meat\"}, {\"nivel\": \"A1\", \"palabra\": \"noodles\", \"significado\": \"long, thin, curly strips of pasta that we use in Chinese and Italian cooking\"}, {\"nivel\": \"A1\", \"palabra\": \"onion\", \"significado\": \"a round, brown or white vegetable with a strong taste and smell\"}, {\"nivel\": \"A1\", \"palabra\": \"orange juice\", \"significado\": \"a drink that we make from oranges\"}, {\"nivel\": \"A1\", \"palabra\": \"pancake\", \"significado\": \"a thin round cake that we cook in a frying pan\"}, {\"nivel\": \"A1\", \"palabra\": \"pasta\", \"significado\": \"a type of Italian food made from flour and water which comes in many shapes\"}, {\"nivel\": \"A1\", \"palabra\": \"pear\", \"significado\": \"a sweet fruit, usually with a green skin and a lot of juice\"}, {\"nivel\": \"A1\", \"palabra\": \"pepper\", \"significado\": \"a green, orange, yellow or red vegetable that people cook or put in salads\"}, {\"nivel\": \"A1\", \"palabra\": \"pineapple\", \"significado\": \"a large, yellow-brown, tropical fruit\"}, {\"nivel\": \"A1\", \"palabra\": \"plate\", \"significado\": \"a dish\"}, {\"nivel\": \"A1\", \"palabra\": \"poultry\", \"significado\": \"meat from chickens, ducks and other birds\"}, {\"nivel\": \"A1\", \"palabra\": \"powder\", \"significado\": \"sth in the form of tiny pieces of dry stuff like flour or dust\"}, {\"nivel\": \"A1\", \"palabra\": \"prawn\", \"significado\": \"a small pink shellfish with a long tail and many legs\"}, {\"nivel\": \"A1\", \"palabra\": \"refreshing\", \"significado\": \"(of a drink) cooling\"}, {\"nivel\": \"A1\", \"palabra\": \"rice\", \"significado\": \"small, white or brown grains from a plant that we cook and eat\"}, {\"nivel\": \"A1\", \"palabra\": \"salad\", \"significado\": \"a mix of vegetables (e.g. lettuce, tomatoes, etc)\"}, {\"nivel\": \"A1\", \"palabra\": \"salt\", \"significado\": \"a white powder that comes from sea water\"}, {\"nivel\": \"A1\", \"palabra\": \"salty\", \"significado\": \"with a lot of salt\"}, {\"nivel\": \"A1\", \"palabra\": \"sauce\", \"significado\": \"a thick liquid that you pour on food to add flavour\"}, {\"nivel\": \"A1\", \"palabra\": \"seafood\", \"significado\": \"fish and shellfish that you can eat\"}, {\"nivel\": \"A1\", \"palabra\": \"seasoning\", \"significado\": \"spices and salt that you add to food\"}, {\"nivel\": \"A1\", \"palabra\": \"speciality\", \"significado\": \"a dish that a person or place is especially famous for\"}, {\"nivel\": \"A1\", \"palabra\": \"spring roll\", \"significado\": \"a type of fried Asian food that contains meat and vegetables\"}, {\"nivel\": \"A1\", \"palabra\": \"strawberry\", \"significado\": \"a sweet red fruit with seeds on the outside\"}, {\"nivel\": \"A1\", \"palabra\": \"sweet\", \"significado\": \"a food with sugar\"}, {\"nivel\": \"A1\", \"palabra\": \"tablespoon\", \"significado\": \"a large spoon that we use to eat soup\"}, {\"nivel\": \"A1\", \"palabra\": \"tableware\", \"significado\": \"the items that you use for meals, e.g. plates, knives, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"taste\", \"significado\": \"to try the flavour of sth\"}, {\"nivel\": \"A1\", \"palabra\": \"teaspoon\", \"significado\": \"a small spoon\"}, {\"nivel\": \"A1\", \"palabra\": \"thirsty\", \"significado\": \"needing sth to drink\"}, {\"nivel\": \"A1\", \"palabra\": \"tip\", \"significado\": \"a small amount of money that you give a waiter, taxi driver, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"try\", \"significado\": \"to taste sth\"}, {\"nivel\": \"A1\", \"palabra\": \"vegetable\", \"significado\": \"a plant that we eat as food\"}, {\"nivel\": \"A1\", \"palabra\": \"weight\", \"significado\": \"how heavy sb or sth is\"}]}, {\"nombre\": \"Grammar in Use\", \"numero\": \"7b\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"bag\", \"significado\": \"a paper or plastic container\"}, {\"nivel\": \"A1\", \"palabra\": \"bottle\", \"significado\": \"a glass or plastic container for drinks\"}, {\"nivel\": \"A1\", \"palabra\": \"burger\", \"significado\": \"a piece of meat between two bread buns\"}, {\"nivel\": \"A1\", \"palabra\": \"carton\", \"significado\": \"a paper container for drinks such as milk, juice, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"countable\", \"significado\": \"(of nouns) that we can count\"}, {\"nivel\": \"A1\", \"palabra\": \"cup\", \"significado\": \"a small container with a handle for serving hot drinks\"}, {\"nivel\": \"A1\", \"palabra\": \"flour\", \"significado\": \"a white powder that we use to make bread, cakes, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"glass\", \"significado\": \"a container for serving water and cold drinks\"}, {\"nivel\": \"A1\", \"palabra\": \"honey\", \"significado\": \"a sweet food made by bees\"}, {\"nivel\": \"A1\", \"palabra\": \"jam\", \"significado\": \"a sweet food made from fruit\"}, {\"nivel\": \"A1\", \"palabra\": \"kilo\", \"significado\": \"a kilogram\"}, {\"nivel\": \"A1\", \"palabra\": \"loaf\", \"significado\": \"a large piece of bread that we can cut into slices\"}, {\"nivel\": \"A1\", \"palabra\": \"olive oil\", \"significado\": \"the liquid that comes from olives\"}, {\"nivel\": \"A1\", \"palabra\": \"packet\", \"significado\": \"a paper container for dry foods such as biscuits\"}, {\"nivel\": \"A1\", \"palabra\": \"peach\", \"significado\": \"a sweet, round, juicy fruit with a stone in the middle\"}, {\"nivel\": \"A1\", \"palabra\": \"piece\", \"significado\": \"a part of sth that we cut or break off\"}, {\"nivel\": \"A1\", \"palabra\": \"pot\", \"significado\": \"a deep round container used for cooking food\"}, {\"nivel\": \"A1\", \"palabra\": \"rainbow\", \"significado\": \"a band of colours sometimes appearing in the sky when it is raining\"}, {\"nivel\": \"A1\", \"palabra\": \"sleepover\", \"significado\": \"a party for children or young people who spend the night at sb\'s house\"}, {\"nivel\": \"A1\", \"palabra\": \"slice\", \"significado\": \"a thin flat piece of bread, cheese, meat, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"smoothie\", \"significado\": \"a cold drink made from fruit, milk and sometimes ice cream\"}, {\"nivel\": \"A1\", \"palabra\": \"uncountable\", \"significado\": \"(of nouns) that we cannot count\"}, {\"nivel\": \"A1\", \"palabra\": \"yoghurt\", \"significado\": \"a thick white food that we make from milk\"}]}, {\"nombre\": \"Skills in Action\", \"numero\": \"7c\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"bake\", \"significado\": \"to cook in the oven\"}, {\"nivel\": \"A1\", \"palabra\": \"baked potato\", \"significado\": \"a potato that we cook in the oven\"}, {\"nivel\": \"A1\", \"palabra\": \"boil\", \"significado\": \"to cook in hot water\"}, {\"nivel\": \"A1\", \"palabra\": \"book\", \"significado\": \"to make a reservation\"}, {\"nivel\": \"A1\", \"palabra\": \"bottled\", \"significado\": \"(of a liquid) in a bottle\"}, {\"nivel\": \"A1\", \"palabra\": \"certainly\", \"significado\": \"of course\"}, {\"nivel\": \"A1\", \"palabra\": \"choose\", \"significado\": \"to pick\"}, {\"nivel\": \"A1\", \"palabra\": \"coconut\", \"significado\": \"a tropical fruit\"}, {\"nivel\": \"A1\", \"palabra\": \"cost\", \"significado\": \"to have a price\"}, {\"nivel\": \"A1\", \"palabra\": \"dessert\", \"significado\": \"a sweet that you usually eat after a meal\"}, {\"nivel\": \"A1\", \"palabra\": \"dish\", \"significado\": \"a type of meal\"}, {\"nivel\": \"A1\", \"palabra\": \"forget\", \"significado\": \"to not remember\"}, {\"nivel\": \"A1\", \"palabra\": \"fried\", \"significado\": \"cooked in hot oil\"}, {\"nivel\": \"A1\", \"palabra\": \"fry\", \"significado\": \"to cook in a pan in hot oil\"}, {\"nivel\": \"A1\", \"palabra\": \"garlic bread\", \"significado\": \"bread with butter and garlic that is heated in the oven\"}, {\"nivel\": \"A1\", \"palabra\": \"grill\", \"significado\": \"to cook over a flame\"}, {\"nivel\": \"A1\", \"palabra\": \"grilled\", \"significado\": \"cooked over a flame\"}, {\"nivel\": \"A1\", \"palabra\": \"helpful\", \"significado\": \"useful\"}, {\"nivel\": \"A1\", \"palabra\": \"homemade\", \"significado\": \"prepared at home\"}, {\"nivel\": \"A1\", \"palabra\": \"location\", \"significado\": \"the position of sth\"}, {\"nivel\": \"A1\", \"palabra\": \"main course\", \"significado\": \"the main meal\"}, {\"nivel\": \"A1\", \"palabra\": \"miss out on\", \"significado\": \"to not have the chance to enjoy sth\"}, {\"nivel\": \"A1\", \"palabra\": \"occasion\", \"significado\": \"a particular time\"}, {\"nivel\": \"A1\", \"palabra\": \"order\", \"significado\": \"to ask for food, drinks, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"order\", \"significado\": \"what you decide to eat/drink at a restaurant or cafeteria\"}, {\"nivel\": \"A1\", \"palabra\": \"recommendation\", \"significado\": \"a suggestion\"}, {\"nivel\": \"A1\", \"palabra\": \"roast\", \"significado\": \"to cook in the oven with added liquid e.g. oil\"}, {\"nivel\": \"A1\", \"palabra\": \"roast\", \"significado\": \"(of food) cooked in an oven or over a fire\"}, {\"nivel\": \"A1\", \"palabra\": \"service\", \"significado\": \"the help that customers get in a shop, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"side dish\", \"significado\": \"a dish served with the main meal\"}, {\"nivel\": \"A1\", \"palabra\": \"sparkling\", \"significado\": \"(of water) with bubbles\"}, {\"nivel\": \"A1\", \"palabra\": \"spicy\", \"significado\": \"with a hot strong flavour\"}, {\"nivel\": \"A1\", \"palabra\": \"starter\", \"significado\": \"the course served before the main meal\"}, {\"nivel\": \"A1\", \"palabra\": \"steak\", \"significado\": \"a thick slice of beef or pork\"}, {\"nivel\": \"A1\", \"palabra\": \"still\", \"significado\": \"(of water) without bubbles\"}, {\"nivel\": \"A1\", \"palabra\": \"superb\", \"significado\": \"excellent\"}, {\"nivel\": \"A1\", \"palabra\": \"tasty\", \"significado\": \"delicious\"}, {\"nivel\": \"A1\", \"palabra\": \"add\", \"significado\": \"(of cooking) to put in another ingredient\"}, {\"nivel\": \"A1\", \"palabra\": \"baking powder\", \"significado\": \"a powder that we use to make cakes rise when we bake them\"}, {\"nivel\": \"A1\", \"palabra\": \"beat\", \"significado\": \"to mix together\"}, {\"nivel\": \"A1\", \"palabra\": \"cut\", \"significado\": \"to chop\"}, {\"nivel\": \"A1\", \"palabra\": \"frying pan\", \"significado\": \"a flat metal container with a long handle used for cooking in hot oil\"}, {\"nivel\": \"A1\", \"palabra\": \"grate\", \"significado\": \"to rub food cutting it into a lot of small pieces\"}, {\"nivel\": \"A1\", \"palabra\": \"instructions\", \"significado\": \"information on how to do sth\"}, {\"nivel\": \"A1\", \"palabra\": \"mix\", \"significado\": \"to put together and combine\"}, {\"nivel\": \"A1\", \"palabra\": \"peel\", \"significado\": \"(of fruit or vegetables) to remove their skin\"}, {\"nivel\": \"A1\", \"palabra\": \"pot\", \"significado\": \"a deep round container used for cooking food\"}, {\"nivel\": \"A1\", \"palabra\": \"recipe\", \"significado\": \"a list of ingredients and instructions on how to cook a certain food\"}, {\"nivel\": \"A1\", \"palabra\": \"repeat\", \"significado\": \"to say sth again using the same words\"}, {\"nivel\": \"A1\", \"palabra\": \"season\", \"significado\": \"to add salt, pepper, etc to food to make it tasty\"}, {\"nivel\": \"A1\", \"palabra\": \"squeeze\", \"significado\": \"to press a fruit or vegetable and take the juice from the inside\"}, {\"nivel\": \"A1\", \"palabra\": \"towel\", \"significado\": \"a piece of cloth used to dry things\"}, {\"nivel\": \"A1\", \"palabra\": \"traditional\", \"significado\": \"being part of a specific culture\"}]}]}, {\"nombre\": \"Adjectives describing places, tourist attractions\", \"numero\": 8, \"subunits\": [{\"nombre\": \"New places, new faces\", \"numero\": \"8a\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"along with\", \"significado\": \"together with\"}, {\"nivel\": \"A1\", \"palabra\": \"boring\", \"significado\": \"not interesting\"}, {\"nivel\": \"A1\", \"palabra\": \"bright\", \"significado\": \"full of light; shining\"}, {\"nivel\": \"A1\", \"palabra\": \"cheap\", \"significado\": \"not costing much money\"}, {\"nivel\": \"A1\", \"palabra\": \"clean\", \"significado\": \"not dirty\"}, {\"nivel\": \"A1\", \"palabra\": \"close to\", \"significado\": \"near\"}, {\"nivel\": \"A1\", \"palabra\": \"crowded\", \"significado\": \"full of people\"}, {\"nivel\": \"A1\", \"palabra\": \"delicious\", \"significado\": \"very tasty\"}, {\"nivel\": \"A1\", \"palabra\": \"dirty\", \"significado\": \"not clean; polluted\"}, {\"nivel\": \"A1\", \"palabra\": \"exciting\", \"significado\": \"very interesting; thrilling\"}, {\"nivel\": \"A1\", \"palabra\": \"expensive\", \"significado\": \"not cheap\"}, {\"nivel\": \"A1\", \"palabra\": \"fascinating\", \"significado\": \"exciting, very interesting\"}, {\"nivel\": \"A1\", \"palabra\": \"fashionable\", \"significado\": \"trendy, stylish\"}, {\"nivel\": \"A1\", \"palabra\": \"footprint\", \"significado\": \"a mark that your foot leaves\"}, {\"nivel\": \"A1\", \"palabra\": \"handprint\", \"significado\": \"a mark that your hand leaves\"}, {\"nivel\": \"A1\", \"palabra\": \"home to\", \"significado\": \"the place where sb/sth lives or exists\"}, {\"nivel\": \"A1\", \"palabra\": \"interesting\", \"significado\": \"that attracts your attention\"}, {\"nivel\": \"A1\", \"palabra\": \"memorable\", \"significado\": \"nice to remember\"}, {\"nivel\": \"A1\", \"palabra\": \"modern\", \"significado\": \"not old or old-fashioned\"}, {\"nivel\": \"A1\", \"palabra\": \"nightlife\", \"significado\": \"entertainment at night\"}, {\"nivel\": \"A1\", \"palabra\": \"noisy\", \"significado\": \"not quiet; full of people\"}, {\"nivel\": \"A1\", \"palabra\": \"old\", \"significado\": \"not new\"}, {\"nivel\": \"A1\", \"palabra\": \"outdoor\", \"significado\": \"not inside\"}, {\"nivel\": \"A1\", \"palabra\": \"place\", \"significado\": \"an area\"}, {\"nivel\": \"A1\", \"palabra\": \"polluted\", \"significado\": \"very dirty\"}, {\"nivel\": \"A1\", \"palabra\": \"quiet\", \"significado\": \"not noisy; not with many people around\"}, {\"nivel\": \"A1\", \"palabra\": \"ride\", \"significado\": \"a journey in a car, bus or train; a trip\"}, {\"nivel\": \"A1\", \"palabra\": \"sight\", \"significado\": \"a landmark; an important place to visit\"}, {\"nivel\": \"A1\", \"palabra\": \"stall\", \"significado\": \"a stand for the sale of goods in a market\"}, {\"nivel\": \"A1\", \"palabra\": \"star\", \"significado\": \"a famous actor\"}, {\"nivel\": \"A1\", \"palabra\": \"suit everyone\'s budget\", \"significado\": \"to be cheap enough for all people\"}, {\"nivel\": \"A1\", \"palabra\": \"sunny\", \"significado\": \"(of weather) with a lot of sun\"}, {\"nivel\": \"A1\", \"palabra\": \"tasty\", \"significado\": \"delicious\"}, {\"nivel\": \"A1\", \"palabra\": \"trendy\", \"significado\": \"fashionable; modern\"}, {\"nivel\": \"A1\", \"palabra\": \"unforgettable\", \"significado\": \"that you will always remember because it\'s interesting, beautiful, etc\"}]}, {\"nombre\": \"Grammar in Use\", \"numero\": \"8b\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"comfortable\", \"significado\": \"convenient\"}, {\"nivel\": \"A1\", \"palabra\": \"destination\", \"significado\": \"the place that you are going to\"}, {\"nivel\": \"A1\", \"palabra\": \"dry\", \"significado\": \"not wet; (of weather) without or with very little rain\"}, {\"nivel\": \"A1\", \"palabra\": \"foreign\", \"significado\": \"from another country\"}, {\"nivel\": \"A1\", \"palabra\": \"noisy\", \"significado\": \"not quiet; full of people\"}, {\"nivel\": \"A1\", \"palabra\": \"peaceful\", \"significado\": \"calm; not noisy\"}, {\"nivel\": \"A1\", \"palabra\": \"popular with\", \"significado\": \"liked by many people\"}, {\"nivel\": \"A1\", \"palabra\": \"quiet\", \"significado\": \"not noisy; not with many people around\"}, {\"nivel\": \"A1\", \"palabra\": \"safe\", \"significado\": \"not dangerous\"}]}, {\"nombre\": \"Skills in Action\", \"numero\": \"8c\", \"palabras\": [{\"nivel\": \"A1\", \"palabra\": \"aquarium\", \"significado\": \"a building where people can go and see fish\"}, {\"nivel\": \"A1\", \"palabra\": \"art gallery\", \"significado\": \"a building where you can see paintings, sculptures, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"buy souvenirs\", \"significado\": \"to get presents on holiday\"}, {\"nivel\": \"A1\", \"palabra\": \"fancy\", \"significado\": \"to want to do sth; to prefer\"}, {\"nivel\": \"A1\", \"palabra\": \"feel like doing sth\", \"significado\": \"to fancy; to want to do or try sth\"}, {\"nivel\": \"A1\", \"palabra\": \"gift shop\", \"significado\": \"a shop where you can buy small presents\"}, {\"nivel\": \"A1\", \"palabra\": \"go for a walk\", \"significado\": \"to go somewhere on foot, but not in a hurry\"}, {\"nivel\": \"A1\", \"palabra\": \"go on rides\", \"significado\": \"to try the different machines at an amusement park\"}, {\"nivel\": \"A1\", \"palabra\": \"historic\", \"significado\": \"famous or important in history\"}, {\"nivel\": \"A1\", \"palabra\": \"market\", \"significado\": \"a place, usually outdoors, where you buy food and other things\"}, {\"nivel\": \"A1\", \"palabra\": \"museum\", \"significado\": \"a place where you can see and learn about important things\"}, {\"nivel\": \"A1\", \"palabra\": \"park\", \"significado\": \"an area with trees and flowers\"}, {\"nivel\": \"A1\", \"palabra\": \"pay a visit\", \"significado\": \"to go and see a place or sb\"}, {\"nivel\": \"A1\", \"palabra\": \"restaurant\", \"significado\": \"a place where you can pay and eat\"}, {\"nivel\": \"A1\", \"palabra\": \"sandy\", \"significado\": \"covered in sand\"}, {\"nivel\": \"A1\", \"palabra\": \"see paintings\", \"significado\": \"to look at works of art\"}, {\"nivel\": \"A1\", \"palabra\": \"see statues\", \"significado\": \"to look at sculptures\"}, {\"nivel\": \"A1\", \"palabra\": \"sports stadium\", \"significado\": \"an open building to see athletic events\"}, {\"nivel\": \"A1\", \"palabra\": \"theatre\", \"significado\": \"a place where people can watch plays\"}, {\"nivel\": \"A1\", \"palabra\": \"theme park\", \"significado\": \"a large amusement park\"}, {\"nivel\": \"A1\", \"palabra\": \"traditional\", \"significado\": \"being part of a specific culture\"}, {\"nivel\": \"A1\", \"palabra\": \"trendy\", \"significado\": \"fashionable; modern\"}, {\"nivel\": \"A1\", \"palabra\": \"try local dishes\", \"significado\": \"to eat food of a specific place\"}, {\"nivel\": \"A1\", \"palabra\": \"watch a football match\", \"significado\": \"to see a game of football\"}, {\"nivel\": \"A1\", \"palabra\": \"watch a performance\", \"significado\": \"to see a play\"}, {\"nivel\": \"A1\", \"palabra\": \"website\", \"significado\": \"a page on the Internet with information\"}, {\"nivel\": \"A1\", \"palabra\": \"boat cruise\", \"significado\": \"a journey on a ship\"}, {\"nivel\": \"A1\", \"palabra\": \"fjord\", \"significado\": \"a strip of sea between high rocks\"}, {\"nivel\": \"A1\", \"palabra\": \"kayaking\", \"significado\": \"a form of sailing in a narrow boat\"}, {\"nivel\": \"A1\", \"palabra\": \"mountain biking\", \"significado\": \"the activity of cycling down mountains\"}, {\"nivel\": \"A1\", \"palabra\": \"must\", \"significado\": \"see (n): sth that you have to see because it\'s very famous, beautiful, etc\"}, {\"nivel\": \"A1\", \"palabra\": \"trekking\", \"significado\": \"the activity of travelling in the countryside on foot\"}, {\"nivel\": \"A1\", \"palabra\": \"volcano\", \"significado\": \"a mountain from which hot molten rock from inside the Earth sometimes bursts\"}, {\"nivel\": \"A1\", \"palabra\": \"waterfall\", \"significado\": \"water dropping from a higher to a lower point\"}, {\"nivel\": \"A1\", \"palabra\": \"welcome\", \"significado\": \"to greet sb in a friendly way\"}]}]}]','manual_text.txt','2025-11-18 21:06:08','2025-11-18 21:06:08',1);
/*!40000 ALTER TABLE `vocabulario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vocabulario_unidades`
--

DROP TABLE IF EXISTS `vocabulario_unidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vocabulario_unidades` (
  `id_unidad` int NOT NULL AUTO_INCREMENT,
  `id_vocabulario_fk` int NOT NULL COMMENT 'References vocabulario table',
  `numero_unidad` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_unidad` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional unit name',
  `descripcion` text COLLATE utf8mb4_unicode_ci COMMENT 'Unit description',
  `palabras_ids` json DEFAULT NULL COMMENT 'Array of word indices from parent vocabulario.contenido',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_unidad`),
  KEY `idx_vocabulario_fk` (`id_vocabulario_fk`),
  KEY `idx_numero_unidad` (`numero_unidad`),
  CONSTRAINT `fk_vocabulario_unidades` FOREIGN KEY (`id_vocabulario_fk`) REFERENCES `vocabulario` (`id_vocabulario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vocabulario_unidades`
--

LOCK TABLES `vocabulario_unidades` WRITE;
/*!40000 ALTER TABLE `vocabulario_unidades` DISABLE KEYS */;
INSERT INTO `vocabulario_unidades` VALUES (37,8,'5a','Birds of a feather',NULL,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(38,8,'5b','Grammar in Use',NULL,'[49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(39,8,'5c','Skills in Action',NULL,'[65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(40,8,'6a','Come rain or shine',NULL,'[94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(41,8,'6b','Grammar in Use',NULL,'[120, 121, 122, 123, 124, 125, 126, 127]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(42,8,'6c','Skills in Action',NULL,'[128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(43,8,'7a','Taste the world',NULL,'[171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(44,8,'7b','Grammar in Use',NULL,'[248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(45,8,'7c','Skills in Action',NULL,'[271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(46,8,'8a','New places, new faces',NULL,'[324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(47,8,'8b','Grammar in Use',NULL,'[359, 360, 361, 362, 363, 364, 365, 366, 367]','2025-11-18 21:06:09','2025-11-18 21:06:09',1),(48,8,'8c','Skills in Action',NULL,'[368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402]','2025-11-18 21:06:09','2025-11-18 21:06:09',1);
/*!40000 ALTER TABLE `vocabulario_unidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_actividades_dashboard`
--

DROP TABLE IF EXISTS `vw_actividades_dashboard`;
/*!50001 DROP VIEW IF EXISTS `vw_actividades_dashboard`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_actividades_dashboard` AS SELECT 
 1 AS `id_actividad`,
 1 AS `titulo`,
 1 AS `descripcion`,
 1 AS `nivel`,
 1 AS `numero_palabras`,
 1 AS `tipo_juego`,
 1 AS `tipo_juego_code`,
 1 AS `icono`,
 1 AS `publicado`,
 1 AS `activa`,
 1 AS `experiencia_minima`,
 1 AS `experiencia_base`,
 1 AS `puntuacion_minima_aprobar`,
 1 AS `grupos_asignados`,
 1 AS `alumnos_participantes`,
 1 AS `promedio_puntuacion`,
 1 AS `completados`,
 1 AS `fecha_creacion`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_detalle_cohorte_alumnos`
--

DROP TABLE IF EXISTS `vw_detalle_cohorte_alumnos`;
/*!50001 DROP VIEW IF EXISTS `vw_detalle_cohorte_alumnos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_detalle_cohorte_alumnos` AS SELECT 
 1 AS `id_cohorte`,
 1 AS `etiqueta`,
 1 AS `id_alumno`,
 1 AS `matricula`,
 1 AS `nombre`,
 1 AS `primer_apellido`,
 1 AS `segundo_apellido`,
 1 AS `experiencia_total`,
 1 AS `promedio_general`,
 1 AS `nivel_actual`,
 1 AS `ultima_actualizacion`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_reporte_alumno_actividades`
--

DROP TABLE IF EXISTS `vw_reporte_alumno_actividades`;
/*!50001 DROP VIEW IF EXISTS `vw_reporte_alumno_actividades`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_reporte_alumno_actividades` AS SELECT 
 1 AS `id_alumno`,
 1 AS `nombre`,
 1 AS `primer_apellido`,
 1 AS `experiencia_total`,
 1 AS `actividades_completadas`,
 1 AS `actividades_aprobadas`,
 1 AS `promedio_puntuacion`,
 1 AS `experiencia_total_actividades`,
 1 AS `ultima_actividad`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_reporte_avance_cohorte`
--

DROP TABLE IF EXISTS `vw_reporte_avance_cohorte`;
/*!50001 DROP VIEW IF EXISTS `vw_reporte_avance_cohorte`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_reporte_avance_cohorte` AS SELECT 
 1 AS `id_cohorte`,
 1 AS `etiqueta`,
 1 AS `anio_ingreso`,
 1 AS `cuatrimestre_inicial`,
 1 AS `programa`,
 1 AS `nivel_inicial`,
 1 AS `total_alumnos`,
 1 AS `suma_experiencia`,
 1 AS `promedio_general_global`,
 1 AS `nivel_actual_promedio`,
 1 AS `primera_actualizacion`,
 1 AS `ultima_actualizacion`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'lingualab2'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_actualizar_actividades_automaticas` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_actualizar_actividades_automaticas`()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id_actividad INT;
  DECLARE v_refresh_frequency VARCHAR(20);
  DECLARE v_refresh_type VARCHAR(20);
  DECLARE v_ultima_actualizacion TIMESTAMP;
  DECLARE v_numero_palabras INT;
  DECLARE v_id_vocabulario INT;
  DECLARE v_unidades_seleccionadas JSON;
  
  -- Cursor para actividades con auto_refresh activo
  DECLARE cur CURSOR FOR 
    SELECT id_actividad, refresh_frequency, refresh_type, 
           ultima_actualizacion, numero_palabras, 
           id_vocabulario_fk, unidades_seleccionadas
    FROM actividades 
    WHERE auto_refresh = TRUE 
      AND activa = TRUE 
      AND id_vocabulario_fk IS NOT NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id_actividad, v_refresh_frequency, v_refresh_type, 
                   v_ultima_actualizacion, v_numero_palabras, 
                   v_id_vocabulario, v_unidades_seleccionadas;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Verificar si necesita actualización según frecuencia
    SET @necesita_actualizacion = FALSE;
    
    IF v_refresh_frequency = 'daily' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 1) THEN
      SET @necesita_actualizacion = TRUE;
    ELSEIF v_refresh_frequency = 'weekly' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 7) THEN
      SET @necesita_actualizacion = TRUE;
    ELSEIF v_refresh_frequency = 'biweekly' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 14) THEN
      SET @necesita_actualizacion = TRUE;
    ELSEIF v_refresh_frequency = 'monthly' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 30) THEN
      SET @necesita_actualizacion = TRUE;
    END IF;
    
    -- Actualizar si es necesario
    IF @necesita_actualizacion = TRUE THEN
      -- Si refresh_type incluye 'palabras' o 'ambos', regenerar palabras_seleccionadas
      IF v_refresh_type IN ('palabras', 'ambos') THEN
        -- Aquí iría la lógica para seleccionar palabras aleatorias
        -- Por ahora solo actualizamos el timestamp
        UPDATE actividades 
        SET ultima_actualizacion = NOW()
        WHERE id_actividad = v_id_actividad;
      END IF;
      
      -- Si refresh_type incluye 'dificultad' o 'ambos', incrementar dificultad
      IF v_refresh_type IN ('dificultad', 'ambos') THEN
        UPDATE actividades 
        SET numero_palabras = LEAST(numero_palabras + 2, 30),
            ultima_actualizacion = NOW()
        WHERE id_actividad = v_id_actividad;
      END IF;
    END IF;
    
  END LOOP;
  
  CLOSE cur;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vw_actividades_dashboard`
--

/*!50001 DROP VIEW IF EXISTS `vw_actividades_dashboard`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_actividades_dashboard` AS select `a`.`id_actividad` AS `id_actividad`,`a`.`titulo` AS `titulo`,`a`.`descripcion` AS `descripcion`,`a`.`nivel` AS `nivel`,`a`.`numero_palabras` AS `numero_palabras`,`j`.`nombre` AS `tipo_juego`,`j`.`tipo_juego` AS `tipo_juego_code`,`j`.`icono` AS `icono`,`a`.`publicado` AS `publicado`,`a`.`activa` AS `activa`,`a`.`experiencia_minima` AS `experiencia_minima`,`a`.`experiencia_base` AS `experiencia_base`,`a`.`puntuacion_minima_aprobar` AS `puntuacion_minima_aprobar`,count(distinct `ag`.`id_grupo_ag_fk`) AS `grupos_asignados`,count(distinct `r`.`id_alumno_resultado_fk`) AS `alumnos_participantes`,avg(`r`.`puntaje`) AS `promedio_puntuacion`,sum((case when (`r`.`completado` = true) then 1 else 0 end)) AS `completados`,`a`.`fecha_creacion` AS `fecha_creacion` from (((`actividades` `a` join `juegos` `j` on((`a`.`id_juego_actividad_fk` = `j`.`id_juego`))) left join `actividad_grupo` `ag` on((`a`.`id_actividad` = `ag`.`id_actividad_ag_fk`))) left join `resultados` `r` on((`a`.`id_actividad` = `r`.`id_actividad_resultado_fk`))) group by `a`.`id_actividad` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_detalle_cohorte_alumnos`
--

/*!50001 DROP VIEW IF EXISTS `vw_detalle_cohorte_alumnos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_detalle_cohorte_alumnos` AS select `c`.`id_cohorte` AS `id_cohorte`,`c`.`etiqueta` AS `etiqueta`,`a`.`id_alumno` AS `id_alumno`,`a`.`matricula` AS `matricula`,`u`.`nombre` AS `nombre`,`u`.`primer_apellido` AS `primer_apellido`,`u`.`segundo_apellido` AS `segundo_apellido`,`a`.`experiencia_total` AS `experiencia_total`,`a`.`promedio_general` AS `promedio_general`,`a`.`nivel_actual` AS `nivel_actual`,`a`.`ultima_actualizacion` AS `ultima_actualizacion` from ((`cohortes` `c` join `alumnos` `a` on((`a`.`id_cohorte_alumno_fk` = `c`.`id_cohorte`))) join `usuarios` `u` on((`a`.`id_usuario_alumno_fk` = `u`.`id_usuario`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_reporte_alumno_actividades`
--

/*!50001 DROP VIEW IF EXISTS `vw_reporte_alumno_actividades`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_reporte_alumno_actividades` AS select `al`.`id_alumno` AS `id_alumno`,`u`.`nombre` AS `nombre`,`u`.`primer_apellido` AS `primer_apellido`,`al`.`experiencia_total` AS `experiencia_total`,count(distinct `r`.`id_actividad_resultado_fk`) AS `actividades_completadas`,sum((case when (`r`.`aprobado` = true) then 1 else 0 end)) AS `actividades_aprobadas`,avg(`r`.`puntaje`) AS `promedio_puntuacion`,sum(`r`.`experiencia_ganada`) AS `experiencia_total_actividades`,max(`r`.`fecha`) AS `ultima_actividad` from ((`alumnos` `al` join `usuarios` `u` on((`al`.`id_usuario_alumno_fk` = `u`.`id_usuario`))) left join `resultados` `r` on((`al`.`id_alumno` = `r`.`id_alumno_resultado_fk`))) group by `al`.`id_alumno` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_reporte_avance_cohorte`
--

/*!50001 DROP VIEW IF EXISTS `vw_reporte_avance_cohorte`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_reporte_avance_cohorte` AS select `c`.`id_cohorte` AS `id_cohorte`,`c`.`etiqueta` AS `etiqueta`,`c`.`anio_ingreso` AS `anio_ingreso`,`c`.`cuatrimestre_inicial` AS `cuatrimestre_inicial`,`p`.`nombre` AS `programa`,`n`.`nombre` AS `nivel_inicial`,count(`a`.`id_alumno`) AS `total_alumnos`,sum(`a`.`experiencia_total`) AS `suma_experiencia`,avg(`a`.`promedio_general`) AS `promedio_general_global`,avg(`a`.`nivel_actual`) AS `nivel_actual_promedio`,min(`a`.`ultima_actualizacion`) AS `primera_actualizacion`,max(`a`.`ultima_actualizacion`) AS `ultima_actualizacion` from (((`cohortes` `c` left join `alumnos` `a` on((`a`.`id_cohorte_alumno_fk` = `c`.`id_cohorte`))) left join `programas_educativos` `p` on((`c`.`id_programa_cohorte_fk` = `p`.`id_programa`))) left join `niveles_educativos` `n` on((`c`.`id_nivel_inicial_fk` = `n`.`id_nivel`))) group by `c`.`id_cohorte`,`c`.`etiqueta`,`c`.`anio_ingreso`,`c`.`cuatrimestre_inicial`,`programa`,`nivel_inicial` */;
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

-- Dump completed on 2025-11-19 16:12:08
