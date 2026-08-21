import { db } from "../src/lib/server/db/client";
import {
  proposalRoles,
  proposals
} from "../src/lib/server/db/schema";

const existing = db
  .select({ id: proposals.id })
  .from(proposals)
  .all();

if (existing.length > 0) {
  console.log("Database already contains proposals.");
  process.exit(0);
}

const seedProposals = [
  {
    id: "animation-timeline-editor",
    title: "Open-source animation timeline editor",
    category: "Software",
    summary: "A collaborative timeline tool for 2D and 3D animation workflows.",
    description:
      "A desktop-first open-source animation timeline editor designed for artists, animators, and technical directors.",
    roles: [
      "TypeScript developer",
      "UX designer",
      "Documentation writer"
    ]
  },
  {
    id: "community-animated-short",
    title: "Community-funded animated short",
    category: "Film and animation",
    summary: "An animated short produced by contributors from the community.",
    description:
      "A collaborative animated short where writers, artists, animators, composers, and editors contribute through visible milestones.",
    roles: ["Animator", "Composer", "Editor"]
  },
  {
    id: "accessible-controller",
    title: "Accessible community game controller",
    category: "Physical products",
    summary: "An affordable controller designed with accessibility contributors.",
    description:
      "A community-designed adaptive controller developed with hardware engineers, industrial designers, and accessibility testers.",
    roles: [
      "Hardware engineer",
      "Industrial designer",
      "Accessibility tester"
    ]
  }
];

for (const proposal of seedProposals) {
  db.insert(proposals)
    .values({
      id: proposal.id,
      title: proposal.title,
      category: proposal.category,
      summary: proposal.summary,
      description: proposal.description,
      supporters: 0,
      createdAt: new Date()
    })
    .run();

  db.insert(proposalRoles)
    .values(
      proposal.roles.map((role) => ({
        proposalId: proposal.id,
        role
      }))
    )
    .run();
}

console.log(`Seeded ${seedProposals.length} proposals.`);

