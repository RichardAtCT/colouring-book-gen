DROP TABLE `accounts`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
DROP TABLE `verification_tokens`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email_verified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `image`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `plan`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `generations_today`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `generations_this_month`;