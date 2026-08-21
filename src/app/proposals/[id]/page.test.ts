import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

const mockGetProposalById = vi.fn();
const mockListProposalEvents = vi.fn();
const mockGetMemberId = vi.fn();
const mockListContributorInterests = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("notFound");
});
const mockGetOwnership = vi.fn();

vi.mock("@/lib/server/proposals", () => ({
  getProposalById: (...args: any[]) => (mockGetProposalById as any)(...args),
  listProposalEvents: (...args: any[]) => (mockListProposalEvents as any)(...args)
}));

vi.mock("@/lib/server/auth/member", () => ({
  getMemberId: (...args: any[]) => (mockGetMemberId as any)(...args)
}));

vi.mock("@/lib/server/contributor-interest", () => ({
  listContributorInterests: (...args: any[]) =>
    (mockListContributorInterests as any)(...args)
}));

vi.mock("next/navigation", () => ({
  notFound: (...args: any[]) => (mockNotFound as any)(...args)
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: () => mockGetOwnership()
        }))
      }))
    }))
  }
}));

vi.mock("@/components/projects/contributor-interest-button", () => ({
  ContributorInterestButton: (props: { proposalId: string; role: string }) =>
    React.createElement("div", {
      "data-testid": "contributor-interest-button",
      "data-proposalid": props.proposalId,
      "data-role": props.role
    })
}));

vi.mock("@/components/projects/support-button", () => ({
  SupportButton: () => React.createElement("div", { "data-testid": "support-button" })
}));

vi.mock("@/components/projects/support-progress", () => ({
  SupportProgress: () => React.createElement("div", { "data-testid": "support-progress" })
}));

vi.mock("@/components/projects/status-advance-button", () => ({
  StatusAdvanceButton: () =>
    React.createElement("div", { "data-testid": "status-advance-button" })
}));

vi.mock("@/components/projects/proposal-timeline", () => ({
  ProposalTimeline: () => React.createElement("div", { "data-testid": "proposal-timeline" })
}));

vi.mock("next/link", () => ({
  default: (props: any) =>
    React.createElement("a", { href: props.href }, props.children)
}));

// Must import after mocks
import ProposalDetailPage from "./page";
import { ContributorInterestButton } from "@/components/projects/contributor-interest-button";

function getTextContent(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return (node as unknown[]).map(getTextContent).join("");
  if (typeof node === "object" && node !== null && "props" in node) {
    const props = (node as { props: { children?: unknown } }).props;
    return getTextContent(props.children);
  }
  return "";
}

function findAllElements(root: unknown, predicate: (node: { type: unknown; props: Record<string, unknown> }) => boolean): Array<{ type: unknown; props: Record<string, unknown> }> {
  const results: Array<{ type: unknown; props: Record<string, unknown> }> = [];
  function walk(node: unknown): void {
    if (node == null || typeof node === "string" || typeof node === "number" || typeof node === "boolean") return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (typeof node === "object" && node !== null && "props" in node) {
      const el = node as { type: unknown; props: Record<string, unknown> };
      if (predicate(el)) results.push(el);
      walk(el.props.children);
    }
  }
  walk(root);
  return results;
}

function makeProposal(overrides: Partial<{
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  status: string;
  supporters: number;
  neededRoles: string[];
}> = {}) {
  return {
    id: "p1",
    title: "Title",
    category: "software",
    summary: "Summary",
    description: "Description",
    status: "published",
    supporters: 0,
    neededRoles: ["dev", "artist"],
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListProposalEvents.mockReturnValue([]);
  mockGetMemberId.mockResolvedValue(undefined);
  mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });
  mockListContributorInterests.mockReturnValue([]);
});

describe("ProposalDetailPage contributor interest visibility", () => {
  it("shows a ContributorInterestButton for each needed role when non-owner and not completed", async () => {
    mockGetProposalById.mockReturnValue(makeProposal({ status: "published", neededRoles: ["dev", "artist"] }));
    mockGetMemberId.mockResolvedValue("member9");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });
    const buttons = findAllElements(result, (el) => el.type === ContributorInterestButton);

    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => String(b.props["role"])).sort()).toEqual(["artist", "dev"]);
    expect(buttons.every((b) => b.props["proposalId"] === "p1")).toBe(true);
  });

  it("hides interest controls when proposal is completed even for non-owner", async () => {
    mockGetProposalById.mockReturnValue(makeProposal({ status: "completed", neededRoles: ["dev", "artist"] }));
    mockGetMemberId.mockResolvedValue("member9");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });
    const buttons = findAllElements(result, (el) => el.type === ContributorInterestButton);

    expect(buttons).toHaveLength(0);
  });

  it("hides interest controls when viewer is the owner even if not completed", async () => {
    mockGetProposalById.mockReturnValue(makeProposal({ status: "published", neededRoles: ["dev"] }));
    mockGetMemberId.mockResolvedValue("owner1");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });
    const buttons = findAllElements(result, (el) => el.type === ContributorInterestButton);

    expect(buttons).toHaveLength(0);
  });

  it("shows owner-only grouped contributor list with six-character labels when owner", async () => {
    mockGetProposalById.mockReturnValue(makeProposal({ status: "published", neededRoles: ["dev"] }));
    mockGetMemberId.mockResolvedValue("owner1");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });
    mockListContributorInterests.mockReturnValue([
      { role: "dev", memberId: "member123456789", createdAt: new Date("2024-01-01T00:00:00Z") },
      { role: "dev", memberId: "member987654321", createdAt: new Date("2024-01-02T00:00:00Z") },
      { role: "artist", memberId: "artist001ABCDEFG", createdAt: new Date("2024-01-03T00:00:00Z") }
    ]);

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });

    // Heading exists only for owner
    const headings = findAllElements(result, (el) => el.type === "h2" && getTextContent(el).includes("Interested contributors"));
    expect(headings).toHaveLength(1);

    // Group headings exist
    const roleHeadings = findAllElements(result, (el) => el.type === "h3");
    expect(roleHeadings.map((el) => getTextContent(el)).sort()).toEqual(["artist", "dev"]);

    // Six-character truncated labels
    const items = findAllElements(result, (el) => el.type === "li");
    const texts = items.map(getTextContent);
    expect(texts.some((t) => t.includes("Member member"))).toBe(true); // slice(0,6) of "member123..." is "member"
    expect(texts.some((t) => t.includes("Member artist"))).toBe(true); // slice of "artist001..." is "artist"
    // Full IDs must not be exposed
    expect(texts.some((t) => t.includes("member123456789"))).toBe(false);
    expect(texts.some((t) => t.includes("artist001ABCDEFG"))).toBe(false);
    // Human-readable timestamp present (year)
    expect(texts.some((t) => t.includes("2024"))).toBe(true);
  });

  it("shows empty state when owner has no interests", async () => {
    mockGetProposalById.mockReturnValue(makeProposal({ status: "published" }));
    mockGetMemberId.mockResolvedValue("owner1");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });
    mockListContributorInterests.mockReturnValue([]);

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });
    const empty = findAllElements(result, (el) => getTextContent(el).includes("No contributors have expressed interest yet."));
    expect(empty.length).toBeGreaterThan(0);
    const headings = findAllElements(result, (el) => el.type === "h2" && getTextContent(el).includes("Interested contributors"));
    expect(headings).toHaveLength(1);
  });

  it("does not fetch or render owner-only list for non-owner (server-side denial)", async () => {
    mockGetProposalById.mockReturnValue(makeProposal({ status: "published" }));
    mockGetMemberId.mockResolvedValue("member9");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });

    expect(mockListContributorInterests).not.toHaveBeenCalled();
    const headings = findAllElements(result, (el) => el.type === "h2" && getTextContent(el).includes("Interested contributors"));
    expect(headings).toHaveLength(0);
    const secretItems = findAllElements(result, (el) => el.type === "li" && getTextContent(el).includes("Member "));
    // Non-owner view still has Needed roles bullets, so filter to contributor list specifically: look for heading first
    // If no heading, there should be no contributor-list items; presence of only Needed roles bullets is allowed
    // We already asserted no heading; additionally ensure no contributor-list fetch happened
    expect(secretItems.filter((el) => getTextContent(el).includes("Member member") || getTextContent(el).includes("Member artist"))).toHaveLength(0);
  });

  it("non-owner cannot retrieve owner list via crafted non-owner memberId when ownership check is server-side", async () => {
    // Even if an attacker crafts a request, server compares cookie memberId to DB owner
    mockGetProposalById.mockReturnValue(makeProposal({ status: "published" }));
    mockGetMemberId.mockResolvedValue("attacker999");
    mockGetOwnership.mockReturnValue({ ownerMemberId: "owner1" });
    mockListContributorInterests.mockReturnValue([
      { role: "dev", memberId: "victim123456", createdAt: new Date() }
    ]);

    const result = await ProposalDetailPage({ params: Promise.resolve({ id: "p1" }) });

    // Must remain denied
    expect(mockListContributorInterests).not.toHaveBeenCalled();
    const headings = findAllElements(result, (el) => el.type === "h2" && getTextContent(el).includes("Interested contributors"));
    expect(headings).toHaveLength(0);
  });
});
