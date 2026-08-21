CREATE TABLE `proposal_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
