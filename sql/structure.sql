-- --------------------------------------------------------
-- Host:                         decipher
-- Server version:               10.0.22-MariaDB-log - MariaDB Server
-- Server OS:                    Linux
-- HeidiSQL Version:             9.3.0.4984
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping structure for table homebooru.config
DROP TABLE IF EXISTS `config`;
CREATE TABLE IF NOT EXISTS `config` (
  `name` varchar(128) NOT NULL COMMENT 'Configuration entry name',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `type` tinyint(3) unsigned NOT NULL COMMENT 'Configuration entry type - string or numeric?',
  `str_value` varchar(1024) DEFAULT NULL COMMENT 'String value for string-type config entries.',
  `int_value` int(11) DEFAULT NULL COMMENT 'Integer value for numeric-type entries.',
  `live` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '(What this was for currently escapes me.)',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Configuration table, holds all sorts of goodies and settings for application-wide usage.  Installation-specific, not user-specific.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.favorites
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Favorite entry ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `user_id` int(10) unsigned NOT NULL COMMENT 'Who is this a favorite for?',
  `post_id` int(10) unsigned NOT NULL COMMENT 'What post is favorited?',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_post_id` (`user_id`,`post_id`),
  KEY `fk_f__post_id` (`post_id`),
  CONSTRAINT `fk_f__post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_f__user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Handles "favoriting" relationship for posts that a given user has favorited.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.image
DROP TABLE IF EXISTS `image`;
CREATE TABLE IF NOT EXISTS `image` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Image ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `type` int(1) unsigned NOT NULL COMMENT 'What type of image is this? Full image, smaller image, thumbnail?',
  `post_id` int(10) unsigned NOT NULL COMMENT 'The post this image belongs to.',
  `filename` varchar(300) NOT NULL COMMENT 'The filename for the image (actual filesystem filename).',
  `md5` char(32) NOT NULL COMMENT 'md5 checksum of the image (used for name lookups sometimes).',
  `sha1` char(40) NOT NULL COMMENT 'sha1 checksum of the image (used for name lookups sometimes).',
  `sha256` char(64) NOT NULL COMMENT 'sha256 checksum of the image (used for name lookups, file integrity).',
  `width` smallint(5) unsigned NOT NULL COMMENT 'Width of the image.',
  `height` smallint(5) unsigned NOT NULL COMMENT 'Height of the image.',
  `size` bigint(20) unsigned NOT NULL COMMENT 'Filesize of the image.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_post_id_unique` (`type`,`post_id`),
  KEY `fk_image__post_id` (`post_id`),
  CONSTRAINT `fk_image__post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Image data table';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.post
DROP TABLE IF EXISTS `post`;
CREATE TABLE IF NOT EXISTS `post` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Post ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `status` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT 'Status of the post, enum.',
  `rating` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '"SFW" rating of the post.',
  `source` varchar(2048) DEFAULT NULL COMMENT 'Source URI/string for the image itself.',
  `submitter` int(10) unsigned DEFAULT NULL COMMENT 'User ID of the submitter (or 0 if anonymously submitted - users to come later).',
  `md5` char(32) NOT NULL COMMENT 'md5 checksum for the post (used for lookups).',
  `sha1` char(40) NOT NULL COMMENT 'sha1 checksum for the post (used for lookups).',
  `sha256` char(64) NOT NULL COMMENT 'sha256 checksum for the post (used for lookups, file integrity).',
  PRIMARY KEY (`id`),
  KEY `fk_post__submitter` (`submitter`),
  KEY `status` (`status`),
  CONSTRAINT `fk_post__submitter` FOREIGN KEY (`submitter`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Post table - contains all generic post data.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.post_audit
DROP TABLE IF EXISTS `post_audit`;
CREATE TABLE IF NOT EXISTS `post_audit` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Audit entry ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `post_id` int(10) unsigned NOT NULL COMMENT 'Post ID this audit entry is for.',
  `type` tinyint(1) unsigned NOT NULL COMMENT 'Type of audit entry this is (tag change, submission, etc).',
  `payload` blob COMMENT 'Any special info about the audit entry itself, changes based on type. JSON.',
  `creator_id` int(10) unsigned DEFAULT NULL COMMENT 'User that generated this audit entry.  No FK yet because users table just isn''t there yet.',
  `origin` varchar(512) DEFAULT NULL COMMENT 'Origin (IP, or hash of IP if privacy mode is on) of the audit event.',
  PRIMARY KEY (`id`),
  KEY `fk_p_audit__post_id` (`post_id`),
  KEY `fk_p_audit__creator_id` (`creator_id`),
  CONSTRAINT `fk_p_audit__creator_id` FOREIGN KEY (`creator_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_p_audit__post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Audit logs for changes to posts overall (or tag changes to posts - same rough scope).';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.post_tag
DROP TABLE IF EXISTS `post_tag`;
CREATE TABLE IF NOT EXISTS `post_tag` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Post-Tag association ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `post_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'Post ID to xref.',
  `tag_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'Tag ID to xref.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_id_tag_id` (`post_id`,`tag_id`),
  KEY `fk_pt__tag_id` (`tag_id`),
  CONSTRAINT `fk_pt__post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt__tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Associations between posts & tags (abbreviated as pt for simplicity''s sake).';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.tag
DROP TABLE IF EXISTS `tag`;
CREATE TABLE IF NOT EXISTS `tag` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Tag ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `title` varchar(200) NOT NULL COMMENT 'Tag text.',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT 'Tag type.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `text` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Tags for images.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.tag_alias
DROP TABLE IF EXISTS `tag_alias`;
CREATE TABLE IF NOT EXISTS `tag_alias` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Alias ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `title` varchar(200) NOT NULL COMMENT 'Tag text to alias.',
  `tag_id` int(10) unsigned NOT NULL COMMENT 'Tag ID for the resolved tag (alias destination).',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag_id` (`tag_id`),
  CONSTRAINT `fk_ta__tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Tag alias resolution table.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.tag_count
DROP TABLE IF EXISTS `tag_count`;
CREATE TABLE IF NOT EXISTS `tag_count` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Tag count ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `tag_id` int(10) unsigned NOT NULL COMMENT 'Tag ID for the tag this count is for.',
  `amount` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'How many times has the tag been used? (Quick way to handle counts!)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag_id` (`tag_id`),
  CONSTRAINT `fk_tc__tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Counters for tag usage.  No, not joking.  \r\n\r\nIt''s a table of its own for performance reasons.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.user
DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'User ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT 'User''s type.',
  `username` varchar(255) NOT NULL COMMENT 'Username for the user.',
  `email` varchar(255) NOT NULL COMMENT 'User''s email address (or hashed version of the email address if privacy mode is on)',
  `active` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the user last logged in (disabled in privacy mode).',
  `akey` varchar(255) DEFAULT NULL COMMENT 'Randomly generated string, used for initially activating the account (not used in privacy mode).',
  `rkey` varchar(255) DEFAULT NULL COMMENT 'Randomly generated string, used for resetting the account password (not used/possible in privacy mode).',
  `options` blob COMMENT 'JSON object of user preferences, options.',
  `karma` int(11) NOT NULL DEFAULT '0' COMMENT '+/- net score of submissions.',
  `submissions` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'Count of overall submissions.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='User data - columns with identifying data should be/will be hashed in privacy mode.';

-- Data exporting was unselected.


-- Dumping structure for table homebooru.user_audit
DROP TABLE IF EXISTS `user_audit`;
CREATE TABLE IF NOT EXISTS `user_audit` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Audit entry ID.',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the row was created.',
  `lmd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the row was last modified.',
  `user_id` int(10) unsigned NOT NULL COMMENT 'User ID this audit entry is for.',
  `type` tinyint(1) unsigned NOT NULL COMMENT 'Type of audit entry this is (tag change, submission, etc.)',
  `payload` blob COMMENT 'Any special info about the audit entry itself, changes based on type. JSON.',
  `creator_id` int(10) unsigned DEFAULT NULL COMMENT 'User that generated this audit entry.',
  `origin` varchar(512) DEFAULT NULL COMMENT 'Origin (IP, or hash of IP if privacy mode is on) of the audit event.',
  PRIMARY KEY (`id`),
  KEY `fk_p_audit__post_id` (`user_id`),
  KEY `fk_u_audit__creator_id` (`creator_id`),
  CONSTRAINT `fk_u_audit__creator_id` FOREIGN KEY (`creator_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_u_audit__user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='Audit logs for changes to posts overall (or tag changes to posts - same rough scope).';

-- Data exporting was unselected.


-- Dumping structure for view homebooru.vw_aliased_tags
DROP VIEW IF EXISTS `vw_aliased_tags`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_aliased_tags` (
	`id` INT(10) UNSIGNED NOT NULL COMMENT 'Tag ID.',
	`title` VARCHAR(200) NOT NULL COMMENT 'Tag text.' COLLATE 'utf8_general_ci',
	`type` TINYINT(1) UNSIGNED NOT NULL COMMENT 'Tag type.',
	`old_tag` VARCHAR(200) NULL COMMENT 'Tag text to alias.' COLLATE 'utf8_general_ci',
	`tag_count` INT(10) UNSIGNED NULL COMMENT 'How many times has the tag been used? (Quick way to handle counts!)'
) ENGINE=MyISAM;


-- Dumping structure for view homebooru.vw_post
DROP VIEW IF EXISTS `vw_post`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_post` (
	`id` INT(10) UNSIGNED NOT NULL COMMENT 'Post ID.',
	`crd` TIMESTAMP NOT NULL COMMENT 'When the row was created.',
	`lmd` TIMESTAMP NOT NULL COMMENT 'When the row was last modified.',
	`status` TINYINT(1) UNSIGNED NOT NULL COMMENT 'Status of the post, enum.',
	`rating` TINYINT(1) UNSIGNED NOT NULL COMMENT '"SFW" rating of the post.',
	`source` VARCHAR(2048) NULL COMMENT 'Source URI/string for the image itself.' COLLATE 'utf8_general_ci',
	`submitter` INT(10) UNSIGNED NULL COMMENT 'User ID of the submitter (or 0 if anonymously submitted - users to come later).',
	`md5` CHAR(32) NOT NULL COMMENT 'md5 checksum for the post (used for lookups).' COLLATE 'utf8_general_ci',
	`sha1` CHAR(40) NOT NULL COMMENT 'sha1 checksum for the post (used for lookups).' COLLATE 'utf8_general_ci',
	`sha256` CHAR(64) NOT NULL COMMENT 'sha256 checksum for the post (used for lookups, file integrity).' COLLATE 'utf8_general_ci',
	`bi_filename` VARCHAR(300) NULL COMMENT 'The filename for the image (actual filesystem filename).' COLLATE 'utf8_general_ci',
	`bi_md5` CHAR(32) NULL COMMENT 'md5 checksum of the image (used for name lookups sometimes).' COLLATE 'utf8_general_ci',
	`bi_sha1` CHAR(40) NULL COMMENT 'sha1 checksum of the image (used for name lookups sometimes).' COLLATE 'utf8_general_ci',
	`bi_width` SMALLINT(5) UNSIGNED NULL COMMENT 'Width of the image.',
	`bi_height` SMALLINT(5) UNSIGNED NULL COMMENT 'Height of the image.',
	`bi_size` BIGINT(20) UNSIGNED NULL COMMENT 'Filesize of the image.',
	`si_filename` VARCHAR(300) NULL COMMENT 'The filename for the image (actual filesystem filename).' COLLATE 'utf8_general_ci',
	`si_md5` CHAR(32) NULL COMMENT 'md5 checksum of the image (used for name lookups sometimes).' COLLATE 'utf8_general_ci',
	`si_sha1` CHAR(40) NULL COMMENT 'sha1 checksum of the image (used for name lookups sometimes).' COLLATE 'utf8_general_ci',
	`si_width` SMALLINT(5) UNSIGNED NULL COMMENT 'Width of the image.',
	`si_height` SMALLINT(5) UNSIGNED NULL COMMENT 'Height of the image.',
	`si_size` BIGINT(20) UNSIGNED NULL COMMENT 'Filesize of the image.',
	`ti_filename` VARCHAR(300) NULL COMMENT 'The filename for the image (actual filesystem filename).' COLLATE 'utf8_general_ci',
	`ti_md5` CHAR(32) NULL COMMENT 'md5 checksum of the image (used for name lookups sometimes).' COLLATE 'utf8_general_ci',
	`ti_sha1` CHAR(40) NULL COMMENT 'sha1 checksum of the image (used for name lookups sometimes).' COLLATE 'utf8_general_ci',
	`ti_width` SMALLINT(5) UNSIGNED NULL COMMENT 'Width of the image.',
	`ti_height` SMALLINT(5) UNSIGNED NULL COMMENT 'Height of the image.',
	`ti_size` BIGINT(20) UNSIGNED NULL COMMENT 'Filesize of the image.',
	`submitter_type` TINYINT(1) UNSIGNED NULL COMMENT 'User\'s type.',
	`submitter_name` VARCHAR(255) NULL COMMENT 'Username for the user.' COLLATE 'utf8_general_ci'
) ENGINE=MyISAM;


-- Dumping structure for view homebooru.vw_post_tags
DROP VIEW IF EXISTS `vw_post_tags`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_post_tags` (
	`post_id` INT(10) UNSIGNED NULL COMMENT 'Post ID to xref.',
	`id` INT(10) UNSIGNED NOT NULL COMMENT 'Tag ID.',
	`title` VARCHAR(200) NOT NULL COMMENT 'Tag text.' COLLATE 'utf8_general_ci',
	`type` TINYINT(1) UNSIGNED NOT NULL COMMENT 'Tag type.',
	`tag_count` INT(10) UNSIGNED NULL COMMENT 'How many times has the tag been used? (Quick way to handle counts!)'
) ENGINE=MyISAM;


-- Dumping structure for trigger homebooru.tr__post_tag__ad
DROP TRIGGER IF EXISTS `tr__post_tag__ad`;
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='';
DELIMITER //
CREATE TRIGGER `tr__post_tag__ad` AFTER DELETE ON `post_tag` FOR EACH ROW BEGIN
-- 
-- handles decrementing the tag when we drop a post-tag association,
--  thereby decreasing the number of times the given tag has been used.
-- 
UPDATE tag_count
SET amount = amount - 1
WHERE tag_id = old.tag_id;

-- 
-- updates modification time for posts when tags are removed
-- currently disabled; might leave the "lmd" column alone to preserve meta-info,
--  and just have a second "modified" column for reflecting modification date when any related post data changes
-- 
-- UPDATE post
-- SET lmd = NOW()
-- WHERE id = old.post_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;


-- Dumping structure for trigger homebooru.tr__post_tag__ai
DROP TRIGGER IF EXISTS `tr__post_tag__ai`;
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='';
DELIMITER //
CREATE TRIGGER `tr__post_tag__ai` AFTER INSERT ON `post_tag` FOR EACH ROW BEGIN
-- 
-- handles inccrementing the tag when we add a post-tag association,
--  thereby increasing the number of times the given tag has been used.
-- 
UPDATE tag_count
SET amount = amount + 1
WHERE tag_id = new.tag_id;

-- 
-- updates modification time for posts when new tags are added
-- currently disabled; might leave the "lmd" column alone to preserve meta-info,
--  and just have a second "modified" column for reflecting modification date when any related post data changes
-- 
-- UPDATE post
-- SET lmd = NOW()
-- WHERE id = new.post_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;


-- Dumping structure for trigger homebooru.tr__tag__ai
DROP TRIGGER IF EXISTS `tr__tag__ai`;
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='';
DELIMITER //
CREATE TRIGGER `tr__tag__ai` AFTER INSERT ON `tag` FOR EACH ROW BEGIN
-- 
-- handles initial creation of the tag_count row when we create a new tag;
--  this table/row handles tracking the tag-use count for performance reasons.
--  when you're using thirty-plus tags, doing counts on every single one...ugh.
-- 
INSERT INTO tag_count (
	tag_id
	, amount
) VALUES (
	NEW.id
	, 0
);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;


-- Dumping structure for view homebooru.vw_aliased_tags
DROP VIEW IF EXISTS `vw_aliased_tags`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_aliased_tags`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`192.168.1.%` SQL SECURITY DEFINER VIEW `vw_aliased_tags` AS select `t`.`id` AS `id`,`t`.`title` AS `title`,`t`.`type` AS `type`,`a`.`title` AS `old_tag`,`tc`.`amount` AS `tag_count` from ((`tag` `t` left join `tag_alias` `a` on((`t`.`id` = `a`.`tag_id`))) left join `tag_count` `tc` on((`tc`.`tag_id` = `a`.`tag_id`)));


-- Dumping structure for view homebooru.vw_post
DROP VIEW IF EXISTS `vw_post`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_post`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`192.168.1.%` SQL SECURITY DEFINER VIEW `vw_post` AS select `p`.`id` AS `id`,`p`.`crd` AS `crd`,`p`.`lmd` AS `lmd`,`p`.`status` AS `status`,`p`.`rating` AS `rating`,`p`.`source` AS `source`,`p`.`submitter` AS `submitter`,`p`.`md5` AS `md5`,`p`.`sha1` AS `sha1`,`p`.`sha256` AS `sha256`,`bi`.`filename` AS `bi_filename`,`bi`.`md5` AS `bi_md5`,`bi`.`sha1` AS `bi_sha1`,`bi`.`width` AS `bi_width`,`bi`.`height` AS `bi_height`,`bi`.`size` AS `bi_size`,`si`.`filename` AS `si_filename`,`si`.`md5` AS `si_md5`,`si`.`sha1` AS `si_sha1`,`si`.`width` AS `si_width`,`si`.`height` AS `si_height`,`si`.`size` AS `si_size`,`ti`.`filename` AS `ti_filename`,`ti`.`md5` AS `ti_md5`,`ti`.`sha1` AS `ti_sha1`,`ti`.`width` AS `ti_width`,`ti`.`height` AS `ti_height`,`ti`.`size` AS `ti_size`,`u`.`type` AS `submitter_type`,`u`.`username` AS `submitter_name` from ((((`post` `p` left join `image` `bi` on(((`bi`.`type` = 1) and (`p`.`id` = `bi`.`post_id`)))) left join `image` `si` on(((`si`.`type` = 1) and (`p`.`id` = `si`.`post_id`)))) left join `image` `ti` on(((`ti`.`type` = 1) and (`p`.`id` = `ti`.`post_id`)))) left join `user` `u` on((`u`.`id` = `p`.`submitter`))) order by `p`.`id` desc;


-- Dumping structure for view homebooru.vw_post_tags
DROP VIEW IF EXISTS `vw_post_tags`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_post_tags`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`192.168.1.%` SQL SECURITY DEFINER VIEW `vw_post_tags` AS select `pt`.`post_id` AS `post_id`,`t`.`id` AS `id`,`t`.`title` AS `title`,`t`.`type` AS `type`,`tc`.`amount` AS `tag_count` from ((`tag` `t` left join `post_tag` `pt` on((`t`.`id` = `pt`.`tag_id`))) left join `tag_count` `tc` on((`tc`.`tag_id` = `pt`.`tag_id`))) group by `pt`.`post_id`,`pt`.`tag_id` order by `t`.`title`,`pt`.`post_id`;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
