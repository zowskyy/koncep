import { beforeEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { proposals, proposalRoles, contributorInterests } from "./db/schema";
import { db } from "@/lib/server/db";
import {
  recordContributorInterest,
  listContributorInterests
} from "./contributor-interest";

vi.mock("@/lib/server/db", async () => {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE proposals (
      id text PRIMARY KEY NOT NULL,
      owner_member_id text,
      title text NOT NULL,
      category text NOT NULL,
      summary text NOT NULL,
      description text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      supporters integer NOT NULL DEFAULT 0,
      created_at integer NOT NULL
    );
    CREATE TABLE proposal_roles (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      proposal_id text NOT NULL,
      role text NOT NULL
    );
    CREATE TABLE contributor_interests (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      proposal_id text NOT NULL,
      role text NOT NULL,
      member_id text NOT NULL,
      created_at integer NOT NULL
    );
    CREATE UNIQUE INDEX contributor_interests_proposal_role_member_idx
      ON contributor_interests (proposal_id, role, member_id);
  `);

  const drizzleDb = drizzle(sqlite, {
    schema: { proposals, proposalRoles, contributorInterests }
  });

  return { db: drizzleDb };
});

function seedProposal(
  id: string,
  ownerMemberId: string | null,
  roles: string[]
) {
  db.insert(proposals)
    .values({
      id,
      ownerMemberId,
      title: "Title",
      category: "software",
      summary: "Summary",
      description: "Description",
      status: "published",
      supporters: 0,
      createdAt: new Date()
    })
    .run();

  if (roles.length > 0) {
    db.insert(proposalRoles)
      .values(roles.map((role) => ({ proposalId: id, role })))
      .run();
  }
}

beforeEach(() => {
  db.delete(contributorInterests).run();
  db.delete(proposalRoles).run();
  db.delete(proposals).run();
});

describe("recordContributorInterest", () => {
  it("inserts valid interest for a non-owner with a listed needed role", () => {
    seedProposal("p1", "owner1", ["dev", "artist"]);
    expect(recordContributorInterest("p1", "dev", "member9")).toEqual({
      outcome: "inserted"
    });
  });

  it("returns duplicate when the same member submits the same proposal + role twice", () => {
    seedProposal("p1", "owner1", ["dev"]);
    expect(recordContributorInterest("p1", "dev", "member9")).toEqual({
      outcome: "inserted"
    });
    expect(recordContributorInterest("p1", "dev", "member9")).toEqual({
      outcome: "duplicate"
    });
  });

  it("allows the same member to register interest in a second distinct needed role", () => {
    seedProposal("p1", "owner1", ["dev", "artist"]);
    expect(recordContributorInterest("p1", "dev", "member9")).toEqual({
      outcome: "inserted"
    });
    expect(recordContributorInterest("p1", "artist", "member9")).toEqual({
      outcome: "inserted"
    });
    expect(listContributorInterests("p1")).toHaveLength(2);
  });

  it("returns invalid_role when the role is not currently needed", () => {
    seedProposal("p1", "owner1", ["dev"]);
    expect(recordContributorInterest("p1", "designer", "member9")).toEqual({
      outcome: "invalid_role"
    });
  });

  it("returns owner when the proposal owner attempts interest", () => {
    seedProposal("p1", "owner1", ["dev"]);
    expect(recordContributorInterest("p1", "dev", "owner1")).toEqual({
      outcome: "owner"
    });
  });

  it("returns missing when the proposal does not exist", () => {
    expect(recordContributorInterest("nope", "dev", "member9")).toEqual({
      outcome: "missing"
    });
  });
});

describe("listContributorInterests", () => {
  it("returns role, memberId, and createdAt for a proposal", () => {
    seedProposal("p1", "owner1", ["dev"]);
    recordContributorInterest("p1", "dev", "member9");
    const list = listContributorInterests("p1");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ role: "dev", memberId: "member9" });
    expect(list[0].createdAt).toBeInstanceOf(Date);
  });

  it("does not return entries belonging to another proposal", () => {
    seedProposal("p1", "owner1", ["dev"]);
    seedProposal("p2", "owner2", ["dev"]);
    recordContributorInterest("p1", "dev", "member9");
    recordContributorInterest("p2", "dev", "member2");
    const p1 = listContributorInterests("p1");
    expect(p1).toHaveLength(1);
    expect(p1[0]).toMatchObject({ role: "dev", memberId: "member9" });
  });
});
