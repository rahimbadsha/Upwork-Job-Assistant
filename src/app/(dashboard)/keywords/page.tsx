import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KeywordManager from "@/components/keywords/KeywordManager";

export default async function KeywordsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const keywords = await prisma.keyword.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  type KW = (typeof keywords)[number];
  return <KeywordManager initialKeywords={keywords.map((k: KW) => ({ ...k, createdAt: k.createdAt.toISOString() }))} />;
}
