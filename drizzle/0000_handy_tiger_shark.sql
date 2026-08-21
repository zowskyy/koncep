CREATE TABLE `proposal_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`supporters` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` text NOT NULL,
	`member_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_signals_proposal_member_idx` ON `support_signals` (`proposal_id`,`member_id`);