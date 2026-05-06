import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Tag, Bookmark, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import FetchJobsButton from "@/components/jobs/FetchJobsButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;

  const [newJobs, savedJobs, keywordCount, recentJobs] = await Promise.all([
    prisma.job.count({ where: { userId, status: "NEW" } }),
    prisma.job.count({ where: { userId, status: "SAVED" } }),
    prisma.keyword.count({ where: { userId, isActive: true } }),
    prisma.job.findMany({
      where: { userId, status: "NEW" },
      orderBy: { postedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        url: true,
        budget: true,
        postedAt: true,
        matchedKeywords: true,
      },
    }),
  ]);

  const stats = [
    { label: "New Jobs", value: newJobs, icon: Briefcase, color: "text-blue-600" },
    { label: "Saved Jobs", value: savedJobs, icon: Bookmark, color: "text-green-600" },
    { label: "Active Keywords", value: keywordCount, icon: Tag, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome back, {session.user.name ?? session.user.email}
          </p>
        </div>
        <FetchJobsButton />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`p-2 rounded-lg bg-slate-100 ${s.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent new jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} />
            Recent New Jobs
          </CardTitle>
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No jobs yet. Click &quot;Fetch Jobs&quot; to get started.</p>
              {keywordCount === 0 && (
                <p className="text-sm mt-1">
                  First,{" "}
                  <Link href="/keywords" className="text-blue-600 hover:underline">
                    add some keywords
                  </Link>
                  .
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentJobs.map((job: typeof recentJobs[number]) => (
                <li key={job.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-slate-900 hover:text-blue-600 line-clamp-1"
                    >
                      {job.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {job.budget && (
                        <span className="text-xs text-green-700 font-medium">{job.budget}</span>
                      )}
                      {job.matchedKeywords.slice(0, 3).map((kw: string) => (
                        <Badge key={kw} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
