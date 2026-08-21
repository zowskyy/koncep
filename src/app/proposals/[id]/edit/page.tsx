import { notFound, redirect } from "next/navigation";
import { getProposalById } from "@/lib/server/proposals";
import { getMemberId } from "@/lib/server/auth/member";
import { db } from "@/lib/server/db";
import { proposals } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { EditProposalForm } from "./edit-form";

type EditProposalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProposalPage({
  params
}: EditProposalPageProps) {
  const { id } = await params;
  const proposal = getProposalById(id);

  if (!proposal) {
    notFound();
  }

  const memberId = await getMemberId();

  const ownership = db
    .select({ ownerMemberId: proposals.ownerMemberId })
    .from(proposals)
    .where(eq(proposals.id, proposal.id))
    .get();

  const isOwner =
    Boolean(memberId) && ownership?.ownerMemberId === memberId;

  if (!isOwner || proposal.status !== "draft") {
    redirect(`/proposals/${proposal.id}`);
  }

  return <EditProposalForm proposal={proposal} />;
}
