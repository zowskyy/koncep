import {
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  ownerMemberId: text("owner_member_id"),
  title: text("title").notNull(),
  category: text("category").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("draft"),
  supporters: integer("supporters").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});

export const proposalRoles = sqliteTable("proposal_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => proposals.id),
  role: text("role").notNull()
});

export const supportSignals = sqliteTable(
  "support_signals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposals.id),
    memberId: text("member_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => [
    uniqueIndex("support_signals_proposal_member_idx").on(
      table.proposalId,
      table.memberId
    )
  ]
);

export const proposalEvents = sqliteTable("proposal_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => proposals.id),
  type: text("type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});
