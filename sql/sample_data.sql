-- --------------------------------------------------------
-- Host:                         decipher
-- Server version:               10.1.9-MariaDB-log - MariaDB Server
-- Server OS:                    Linux
-- HeidiSQL Version:             9.3.0.4984
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
-- Dumping data for table homebooru.config: ~0 rows (approximately)
DELETE FROM `config`;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
/*!40000 ALTER TABLE `config` ENABLE KEYS */;

-- Dumping data for table homebooru.favorites: ~1 rows (approximately)
DELETE FROM `favorites`;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` (`id`, `crd`, `user_id`, `post_id`) VALUES
	(1, '2015-11-22 13:46:05', 1, 1);
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;

-- Dumping data for table homebooru.image: ~6 rows (approximately)
DELETE FROM `image`;
/*!40000 ALTER TABLE `image` DISABLE KEYS */;
INSERT INTO `image` (`id`, `crd`, `lmd`, `status`, `type`, `post_id`, `filename`, `md5`, `sha1`, `sha256`, `width`, `height`, `size`) VALUES
	(1, '2015-12-06 11:22:32', '2015-12-06 11:09:07', 0, 1, 1, 'file.jpg', '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51', 10, 10, 1500),
	(4, '2015-12-06 11:22:32', '2015-12-06 11:09:07', 0, 2, 1, 'file_sm.jpg', '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51', 10, 10, 1500),
	(5, '2015-12-06 11:22:32', '2015-12-06 11:09:07', 0, 3, 1, 'file_th.jpg', '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51', 10, 10, 1500),
	(7, '2015-12-06 11:22:32', '2015-12-06 11:09:07', 0, 1, 2, 'file2.jpg', '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51', 20, 20, 1500),
	(8, '2015-12-06 11:22:32', '2015-12-06 11:09:07', 0, 2, 2, 'file_sm.jpg', '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51', 20, 20, 1500),
	(9, '2015-12-06 11:22:32', '2015-12-06 11:09:07', 0, 3, 2, 'file_th.jpg', '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51', 20, 20, 1500);
/*!40000 ALTER TABLE `image` ENABLE KEYS */;

-- Dumping data for table homebooru.post: ~2 rows (approximately)
DELETE FROM `post`;
/*!40000 ALTER TABLE `post` DISABLE KEYS */;
INSERT INTO `post` (`id`, `crd`, `lmd`, `status`, `rating`, `source`, `submitter`, `md5`, `sha1`, `sha256`) VALUES
	(1, '2015-12-06 11:21:53', '2015-12-06 11:09:33', 5, 2, NULL, 1, '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51'),
	(2, '2015-12-06 11:21:53', '2015-12-06 11:09:33', 5, 1, NULL, 1, '0c0d03edf4e145ffd75eafb6d73deaa7', '9414b608df81fbc2563f467df918ca652c899953', '8030404398e6639ff1395dd8e38c782bf6c9e00229adfc54408c967a2e981b51');
/*!40000 ALTER TABLE `post` ENABLE KEYS */;

-- Dumping data for table homebooru.post_audit: ~0 rows (approximately)
DELETE FROM `post_audit`;
/*!40000 ALTER TABLE `post_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_audit` ENABLE KEYS */;

-- Dumping data for table homebooru.post_tag: ~7 rows (approximately)
DELETE FROM `post_tag`;
/*!40000 ALTER TABLE `post_tag` DISABLE KEYS */;
INSERT INTO `post_tag` (`id`, `crd`, `post_id`, `tag_id`) VALUES
	(1, '2015-12-06 11:19:39', 1, 1),
	(2, '2015-12-06 11:19:39', 1, 3),
	(3, '2015-12-06 11:19:39', 2, 1),
	(4, '2015-12-06 11:19:39', 2, 2),
	(6, '2015-12-06 11:19:39', 1, 8),
	(7, '2015-12-06 11:19:39', 1, 5),
	(15, '2016-01-01 10:30:41', 1, 6);
/*!40000 ALTER TABLE `post_tag` ENABLE KEYS */;

-- Dumping data for table homebooru.tag: ~8 rows (approximately)
DELETE FROM `tag`;
/*!40000 ALTER TABLE `tag` DISABLE KEYS */;
INSERT INTO `tag` (`id`, `crd`, `type`, `title`) VALUES
	(1, '2015-12-06 11:19:07', 1, 'some_tag'),
	(2, '2015-12-06 11:19:07', 2, 'another_tag'),
	(3, '2015-12-06 11:19:07', 2, 'yet_another_tag'),
	(4, '2015-12-06 11:19:07', 6, 'aliased_tag'),
	(5, '2015-12-06 11:19:07', 1, 'yay_tags'),
	(6, '2015-12-06 11:19:07', 2, 'aeronaut_sucks'),
	(7, '2015-12-06 11:19:07', 1, 'whatever'),
	(8, '2015-12-06 11:19:07', 2, 'more_tags');
/*!40000 ALTER TABLE `tag` ENABLE KEYS */;

-- Dumping data for table homebooru.tag_alias: ~1 rows (approximately)
DELETE FROM `tag_alias`;
/*!40000 ALTER TABLE `tag_alias` DISABLE KEYS */;
INSERT INTO `tag_alias` (`id`, `crd`, `title`, `tag_id`) VALUES
	(1, '2015-12-06 11:18:15', 'aliased_tag', 1);
/*!40000 ALTER TABLE `tag_alias` ENABLE KEYS */;

-- Dumping data for table homebooru.tag_count: ~8 rows (approximately)
DELETE FROM `tag_count`;
/*!40000 ALTER TABLE `tag_count` DISABLE KEYS */;
INSERT INTO `tag_count` (`id`, `crd`, `tag_id`, `amount`) VALUES
	(1, '2016-01-01 10:25:39', 6, 1),
	(2, '2016-01-01 10:25:39', 4, 0),
	(3, '2016-01-01 10:25:39', 2, 1),
	(4, '2016-01-01 10:25:39', 8, 1),
	(5, '2016-01-01 10:25:39', 1, 2),
	(6, '2016-01-01 10:25:39', 7, 0),
	(7, '2016-01-01 10:25:39', 5, 1),
	(8, '2016-01-01 10:25:39', 3, 1);
/*!40000 ALTER TABLE `tag_count` ENABLE KEYS */;

-- Dumping data for table homebooru.user: ~1 rows (approximately)
DELETE FROM `user`;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` (`id`, `crd`, `lmd`, `type`, `username`, `email`, `active`, `akey`, `rkey`, `options`, `karma`, `submissions`) VALUES
	(1, '2015-11-22 13:34:14', '2015-12-06 11:15:19', 0, 'Anonymous', 'sha256:c8b5f366611ec7780982fdff810fb3aa6316fcfda775dba22bc8216ca7c89e2f', '2015-11-22 13:34:14', NULL, NULL, NULL, 0, 0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;

-- Dumping data for table homebooru.user_audit: ~0 rows (approximately)
DELETE FROM `user_audit`;
/*!40000 ALTER TABLE `user_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_audit` ENABLE KEYS */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
