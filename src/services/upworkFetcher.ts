import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";

const parser = new Parser({
  customFields: {
    item: [
      ["budget", "budget"],
      ["country", "country"],
      ["category2", "category"],
    ],
  },
});

const UPWORK_RSS_BASE = "https://www.upwork.com/ab/feed/jobs/rss";

interface FetchResult {
  fetched: number;
  newJobs: number;
  duplicates: number;
}

function buildRssUrl(keywords: string[]): string {
  const query = keywords.join(" OR ");
  const params = new URLSearchParams({
    q: query,
    sort: "recency",
    paging: "0;50",
  });
  return `${UPWORK_RSS_BASE}?${params.toString()}`;
}

function extractUpworkId(link: string): string {
  const match = link.match(/~([a-f0-9]+)/);
  return match ? match[1] : link;
}

function extractBudget(content: string): { budget: string | null; budgetMin: number | null; budgetMax: number | null } {
  const fixedMatch = content.match(/\$([0-9,]+)\s*Fixed/i);
  if (fixedMatch) {
    const val = parseFloat(fixedMatch[1].replace(/,/g, ""));
    return { budget: `$${fixedMatch[1]} Fixed`, budgetMin: val, budgetMax: val };
  }

  const hourlyMatch = content.match(/\$([0-9.]+)[–\-]?\$?([0-9.]+)?\s*(?:\/hr|per hour|hourly)/i);
  if (hourlyMatch) {
    const min = parseFloat(hourlyMatch[1]);
    const max = hourlyMatch[2] ? parseFloat(hourlyMatch[2]) : min;
    return { budget: `$${min}–$${max}/hr`, budgetMin: min, budgetMax: max };
  }

  return { budget: null, budgetMin: null, budgetMax: null };
}

function matchKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

export async function fetchJobsForUser(userId: string): Promise<FetchResult> {
  const keywords = await prisma.keyword.findMany({
    where: { userId, isActive: true },
    select: { text: true },
  });

  if (keywords.length === 0) return { fetched: 0, newJobs: 0, duplicates: 0 };

  const keywordTexts = keywords.map((k: { text: string }) => k.text);
  const rssUrl = buildRssUrl(keywordTexts);

  let feed;
  try {
    feed = await parser.parseURL(rssUrl);
  } catch {
    throw new Error(`Failed to fetch Upwork RSS: ${rssUrl}`);
  }

  const items = feed.items ?? [];
  let newJobs = 0;
  let duplicates = 0;

  for (const item of items) {
    const upworkId = extractUpworkId(item.link ?? item.guid ?? "");
    const fullText = `${item.title ?? ""} ${item.content ?? item.contentSnippet ?? ""}`;
    const { budget, budgetMin, budgetMax } = extractBudget(fullText);
    const matched = matchKeywords(fullText, keywordTexts);

    const postedAt = item.pubDate ? new Date(item.pubDate) : new Date();

    try {
      await prisma.job.create({
        data: {
          upworkId,
          title: item.title ?? "Untitled",
          description: item.content ?? item.contentSnippet ?? "",
          url: item.link ?? "",
          budget,
          budgetMin,
          budgetMax,
          category: item.categories?.[0] ?? null,
          postedAt,
          matchedKeywords: matched,
          userId,
        },
      });
      newJobs++;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002") {
        duplicates++;
      } else {
        throw e;
      }
    }
  }

  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.stat.upsert({
    where: { userId_date: { userId, date: today } },
    update: { jobsFetched: { increment: newJobs } },
    create: { userId, date: today, jobsFetched: newJobs },
  });

  return { fetched: items.length, newJobs, duplicates };
}

export async function fetchJobsForAllUsers(): Promise<void> {
  const users = await prisma.user.findMany({ select: { id: true } });
  await Promise.allSettled(users.map((u: { id: string }) => fetchJobsForUser(u.id)));
}
