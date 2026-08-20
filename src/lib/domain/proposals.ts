export type Proposal = {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  supporters: number;
  neededRoles: string[];
};

export const proposals: Proposal[] = [
  {
    id: "animation-timeline-editor",
    title: "Open-source animation timeline editor",
    category: "Software",
    summary: "A collaborative timeline tool for 2D and 3D animation workflows.",
    description:
      "A desktop-first open-source animation timeline editor designed for artists, animators, and technical directors.",
    supporters: 1284,
    neededRoles: [
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
    supporters: 842,
    neededRoles: ["Animator", "Composer", "Editor"]
  },
  {
    id: "accessible-controller",
    title: "Accessible community game controller",
    category: "Physical products",
    summary: "An affordable controller designed with accessibility contributors.",
    description:
      "A community-designed adaptive controller developed with hardware engineers, industrial designers, and accessibility testers.",
    supporters: 419,
    neededRoles: [
      "Hardware engineer",
      "Industrial designer",
      "Accessibility tester"
    ]
  }
];

export function getProposalById(id: string): Proposal | undefined {
  return proposals.find((proposal) => proposal.id === id);
}
