"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Briefcase, Bookmark, Eye, SkipForward, Tag } from "lucide-react";

interface DailyStat {
  date: string;
  jobsFetched: number;
  jobsViewed: number;
  jobsSaved: number;
  jobsSkipped: number;
}

interface StatsData {
  daily: DailyStat[];
  totals: { fetched: number; viewed: number; saved: number; skipped: number };
  jobsByStatus: Record<string, number>;
  totalKeywords: number;
}

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function StatsView() {
  const [data, setData] = useState<StatsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const summaryCards = data
    ? [
        { label: "Jobs Fetched", value: data.totals.fetched, icon: Briefcase, color: "text-blue-600" },
        { label: "Jobs Viewed", value: data.totals.viewed, icon: Eye, color: "text-yellow-600" },
        { label: "Jobs Saved", value: data.totals.saved, icon: Bookmark, color: "text-green-600" },
        { label: "Jobs Skipped", value: data.totals.skipped, icon: SkipForward, color: "text-slate-500" },
        { label: "Active Keywords", value: data.totalKeywords, icon: Tag, color: "text-purple-600" },
      ]
    : [];

  const maxFetched = data
    ? Math.max(...data.daily.map((d) => d.jobsFetched), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
        <div className="flex gap-1">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                days === d
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {summaryCards.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label}>
                  <CardContent className="pt-4 pb-3">
                    <div className={`mb-1 ${s.color}`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Jobs by status */}
          {data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 size={16} />
                  All-time Jobs by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(data.jobsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <Badge variant="secondary">{status}</Badge>
                      <span className="text-sm font-semibold text-slate-700">{count}</span>
                    </div>
                  ))}
                  {Object.keys(data.jobsByStatus).length === 0 && (
                    <p className="text-sm text-slate-400">No jobs yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily bar chart */}
          {data && data.daily.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={16} />
                  Daily Jobs Fetched (last {days} days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                  {data.daily.map((d) => {
                    const height = Math.max(2, (d.jobsFetched / maxFetched) * 100);
                    const date = new Date(d.date);
                    return (
                      <div
                        key={d.date}
                        className="flex flex-col items-center gap-1 flex-1 min-w-[24px]"
                        title={`${date.toLocaleDateString()}: ${d.jobsFetched} fetched`}
                      >
                        <div
                          className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[10px] text-slate-400 rotate-45 origin-left whitespace-nowrap">
                          {date.getMonth() + 1}/{date.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {data && data.daily.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data yet for this period. Fetch some jobs to see stats.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
