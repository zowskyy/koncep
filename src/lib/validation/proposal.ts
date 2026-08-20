import { z } from "zod";

export const proposalSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(20).max(500),
  description: z.string().trim().min(50).max(10000),
  category: z.enum([
    "games",
    "film-animation",
    "music-audio",
    "publishing",
    "software",
    "education",
    "research",
    "events",
    "physical-products",
    "community"
  ]),
  neededRoles: z.array(z.string().trim().min(1)).min(1).max(20)
});

export type ProposalInput = z.infer<typeof proposalSchema>;
