import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30")));

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const userId = session.user.id;

  const [dailyStats, totalKeywords] = await prisma.$transaction([
    prisma.stat.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.keyword.count({ where: { userId, isActive: true } }),
  ]);

  // Count jobs per status individually — avoids groupBy API quirks
  const statuses = Object.values(JobStatus);
  const countResults = await Promise.all(
    statuses.map((s) => prisma.job.count({ where: { userId, status: s } }))
  );
  const jobsByStatus = Object.fromEntries(statuses.map((s, i) => [s, countResults[i]]));

  type Totals = { fetched: number; viewed: number; saved: number; skipped: number };
  const totals = dailyStats.reduce<Totals>(
    (acc, s) => ({
      fetched: acc.fetched + s.jobsFetched,
      viewed: acc.viewed + s.jobsViewed,
      saved: acc.saved + s.jobsSaved,
      skipped: acc.skipped + s.jobsSkipped,
    }),
    { fetched: 0, viewed: 0, saved: 0, skipped: 0 }
  );

  return NextResponse.json({ daily: dailyStats, totals, jobsByStatus, totalKeywords });
}
