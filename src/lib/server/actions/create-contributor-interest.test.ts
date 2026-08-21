import { beforeEach, describe, expect, it, vi } from "vitest";
import { createContributorInterest } from "@/lib/server/actions/create-contributor-interest";
import { recordContributorInterest } from "@/lib/server/contributor-interest";
import { getOrCreateMemberId } from "@/lib/server/auth/member";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/server/auth/member", () => ({
  getOrCreateMemberId: vi.fn()
}));

vi.mock("@/lib/server/contributor-interest", () => ({
  recordContributorInterest: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const INITIAL_STATE = {
  error: null,
  interested: false,
  alreadyInterested: false
};

const TEST_MEMBER_ID = "test-member-1234";
const PROPOSAL_ID = "test-proposal-1";
const ROLE = "Developer";

function buildFormData(proposalId: string, role: string): FormData {
  const formData = new FormData();
  formData.set("proposalId", proposalId);
  formData.set("role", role);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrCreateMemberId).mockResolvedValue(TEST_MEMBER_ID);
});

describe("createContributorInterest action", () => {
  it("returns an error when proposalId is missing and does not call the core", async () => {
    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData("", ROLE)
    );

    expect(result.error).toBe("A proposal and role are required.");
    expect(result.interested).toBe(false);
    expect(result.alreadyInterested).toBe(false);
    expect(recordContributorInterest).not.toHaveBeenCalled();
    expect(getOrCreateMemberId).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns an error when role is missing and does not call the core", async () => {
    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData(PROPOSAL_ID, "")
    );

    expect(result.error).toBe("A proposal and role are required.");
    expect(result.interested).toBe(false);
    expect(result.alreadyInterested).toBe(false);
    expect(recordContributorInterest).not.toHaveBeenCalled();
    expect(getOrCreateMemberId).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("on inserted returns interested and revalidates exactly /proposals/[id]", async () => {
    vi.mocked(recordContributorInterest).mockReturnValue({ outcome: "inserted" });

    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData(PROPOSAL_ID, ROLE)
    );

    expect(result.interested).toBe(true);
    expect(result.alreadyInterested).toBe(false);
    expect(result.error).toBeNull();
    expect(getOrCreateMemberId).toHaveBeenCalledTimes(1);
    expect(recordContributorInterest).toHaveBeenCalledWith(
      PROPOSAL_ID,
      ROLE,
      TEST_MEMBER_ID
    );
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith(`/proposals/${PROPOSAL_ID}`);
  });

  it("on duplicate returns alreadyInterested and does not revalidate", async () => {
    vi.mocked(recordContributorInterest).mockReturnValue({ outcome: "duplicate" });

    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData(PROPOSAL_ID, ROLE)
    );

    expect(result.interested).toBe(false);
    expect(result.alreadyInterested).toBe(true);
    expect(result.error).toBeNull();
    expect(getOrCreateMemberId).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("on missing returns a user-safe error, does not revalidate, and does not disclose the member id", async () => {
    vi.mocked(recordContributorInterest).mockReturnValue({ outcome: "missing" });

    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData(PROPOSAL_ID, ROLE)
    );

    expect(result.error).toBe("This proposal could not be found.");
    expect(result.interested).toBe(false);
    expect(result.alreadyInterested).toBe(false);
    expect(result.error).not.toContain(TEST_MEMBER_ID);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("on invalid_role returns a user-safe error, does not revalidate, and does not disclose the member id", async () => {
    vi.mocked(recordContributorInterest).mockReturnValue({
      outcome: "invalid_role"
    });

    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData(PROPOSAL_ID, ROLE)
    );

    expect(result.error).toBe("That role is not part of this proposal.");
    expect(result.interested).toBe(false);
    expect(result.alreadyInterested).toBe(false);
    expect(result.error).not.toContain(TEST_MEMBER_ID);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("on owner returns a user-safe error, does not revalidate, and does not disclose the member id", async () => {
    vi.mocked(recordContributorInterest).mockReturnValue({ outcome: "owner" });

    const result = await createContributorInterest(
      INITIAL_STATE,
      buildFormData(PROPOSAL_ID, ROLE)
    );

    expect(result.error).toBe("You cannot express interest in your own proposal.");
    expect(result.interested).toBe(false);
    expect(result.alreadyInterested).toBe(false);
    expect(result.error).not.toContain(TEST_MEMBER_ID);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
