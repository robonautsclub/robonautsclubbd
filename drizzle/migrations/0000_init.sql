CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`permissions_version` integer DEFAULT 5 NOT NULL,
	`disabled` integer DEFAULT false NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
CREATE INDEX `users_email_idx` ON `users` (`email`);

CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text,
	`title` text DEFAULT '' NOT NULL,
	`created_by` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);
CREATE INDEX `events_slug_idx` ON `events` (`slug`);

CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`registration_id` text,
	`email` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text
);
CREATE INDEX `bookings_event_id_idx` ON `bookings` (`event_id`);
CREATE INDEX `bookings_registration_id_idx` ON `bookings` (`registration_id`);

CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text,
	`title` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);
CREATE INDEX `news_slug_idx` ON `news` (`slug`);

CREATE TABLE `gallery_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text
);
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);

CREATE TABLE `robofest_content` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text
);

CREATE TABLE `robofest_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`team_number` text,
	`status` text,
	`email` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);
CREATE INDEX `robofest_registrations_team_number_idx` ON `robofest_registrations` (`team_number`);
CREATE INDEX `robofest_registrations_status_idx` ON `robofest_registrations` (`status`);

CREATE TABLE `robofest_campus_ambassadors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE TABLE `robofest_team_counters` (
	`id` text PRIMARY KEY NOT NULL,
	`prefix` text NOT NULL,
	`next` integer DEFAULT 1 NOT NULL,
	`updated_at` text
);

CREATE TABLE `school_directory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`name_lower` text,
	`status` text,
	`is_active` integer DEFAULT true NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);
CREATE INDEX `school_directory_name_lower_idx` ON `school_directory` (`name_lower`);

CREATE TABLE `homepage_orgs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text,
	`name` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE TABLE `certificate_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE TABLE `bkash_pending_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text,
	`status` text,
	`event_id` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE TABLE `payment_gateway_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text
);

CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
CREATE INDEX `password_reset_tokens_hash_idx` ON `password_reset_tokens` (`token_hash`);
