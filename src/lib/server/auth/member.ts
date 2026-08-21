"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const memberCookieName = "koncep_member_id";

export async function getMemberId(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(memberCookieName)?.value;
}

export async function getOrCreateMemberId(): Promise<string> {
  const memberId = await getMemberId();

  if (memberId) {
    return memberId;
  }

  const cookieStore = await cookies();
  const newMemberId = randomUUID();

  cookieStore.set(memberCookieName, newMemberId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return newMemberId;
}
