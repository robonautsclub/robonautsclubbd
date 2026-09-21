ALTER TABLE `robofest_registrations` ADD COLUMN `category` text;
--> statement-breakpoint
ALTER TABLE `robofest_registrations` ADD COLUMN `round_city` text;
--> statement-breakpoint
ALTER TABLE `robofest_registrations` ADD COLUMN `age_category` text;
--> statement-breakpoint
ALTER TABLE `robofest_registrations` ADD COLUMN `campus_ambassador_id` text;
--> statement-breakpoint
ALTER TABLE `robofest_registrations` ADD COLUMN `payment_status` text;
--> statement-breakpoint
ALTER TABLE `robofest_registrations` ADD COLUMN `amount_paid` real;
--> statement-breakpoint
ALTER TABLE `robofest_registrations` ADD COLUMN `team_size` integer;
--> statement-breakpoint
UPDATE `robofest_registrations` SET
  `category` = json_extract(`payload`, '$.category'),
  `round_city` = json_extract(`payload`, '$.roundCity'),
  `age_category` = json_extract(`payload`, '$.ageCategory'),
  `campus_ambassador_id` = json_extract(`payload`, '$.campusAmbassadorId'),
  `payment_status` = json_extract(`payload`, '$.paymentStatus'),
  `amount_paid` = CAST(json_extract(`payload`, '$.amountPaid') AS REAL),
  `team_size` = CAST(json_extract(`payload`, '$.teamSize') AS INTEGER);
--> statement-breakpoint
CREATE INDEX `robofest_registrations_status_created_at_idx` ON `robofest_registrations` (`status`, `created_at`);
--> statement-breakpoint
CREATE INDEX `robofest_registrations_campus_ambassador_id_idx` ON `robofest_registrations` (`campus_ambassador_id`);
--> statement-breakpoint
CREATE INDEX `robofest_registrations_created_at_idx` ON `robofest_registrations` (`created_at`);
