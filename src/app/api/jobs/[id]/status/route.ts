import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma";

const schema = z.object({
  status: z.nativeEnum(JobStatus),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { status } = parsed.data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updated = await prisma.job.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { status },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update daily stats
  const statUpdate: Record<string, { increment: number }> = {};
  if (status === "SAVED") statUpdate.jobsSaved = { increment: 1 };
  if (status === "SKIPPED") statUpdate.jobsSkipped = { increment: 1 };
  if (status === "VIEWED") statUpdate.jobsViewed = { increment: 1 };

  if (Object.keys(statUpdate).length > 0) {
    await prisma.stat.upsert({
      where: { userId_date: { userId: session.user.id, date: today } },
      update: statUpdate,
      create: { userId: session.user.id, date: today, ...Object.fromEntries(Object.entries(statUpdate).map(([k, v]) => [k, v.increment])) },
    });
  }

  return NextResponse.json({ id: params.id, status });
}
