CREATE TABLE `contributor_interests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` text NOT NULL,
	`role` text NOT NULL,
	`member_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contributor_interests_proposal_role_member_idx` ON `contributor_interests` (`proposal_id`,`role`,`member_id`);