import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  text: z.string().min(1).max(100).trim(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keywords = await prisma.keyword.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(keywords);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    // Support bulk creation: { keywords: ["kw1", "kw2"] } or single { text: "kw" }
    if (Array.isArray(body.keywords)) {
      const texts = body.keywords
        .map((k: string) => k.trim())
        .filter(Boolean)
        .slice(0, 50); // max 50 at once

      const created = await prisma.$transaction(
        texts.map((text: string) =>
          prisma.keyword.upsert({
            where: { userId_text: { userId: session.user.id, text } },
            update: { isActive: true },
            create: { text, userId: session.user.id },
          })
        )
      );

      return NextResponse.json(created, { status: 201 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const keyword = await prisma.keyword.upsert({
      where: { userId_text: { userId: session.user.id, text: parsed.data.text } },
      update: { isActive: true },
      create: { text: parsed.data.text, userId: session.user.id },
    });

    return NextResponse.json(keyword, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
