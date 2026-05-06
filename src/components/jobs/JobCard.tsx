"use client";

import { useState } from "react";
import { ExternalLink, Bookmark, Eye, SkipForward, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  description: string;
  url: string;
  budget: string | null;
  category: string | null;
  country: string | null;
  postedAt: string;
  status: string;
  matchedKeywords: string[];
}

interface Props {
  job: Job;
  onStatusChange?: (id: string, status: string) => void;
}

const STATUS_CONFIG = {
  NEW: { label: "New", class: "bg-blue-100 text-blue-800" },
  VIEWED: { label: "Viewed", class: "bg-yellow-100 text-yellow-800" },
  SAVED: { label: "Saved", class: "bg-green-100 text-green-800" },
  SKIPPED: { label: "Skipped", class: "bg-slate-100 text-slate-500" },
  APPLIED: { label: "Applied", class: "bg-purple-100 text-purple-800" },
} as const;

export default function JobCard({ job, onStatusChange }: Props) {
  const [status, setStatus] = useState(job.status);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus(newStatus);
      onStatusChange?.(job.id, newStatus);
      toast.success(`Marked as ${newStatus.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NEW;

  return (
    <Card className={cn("transition-opacity", status === "SKIPPED" && "opacity-60")}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 hover:text-blue-600 line-clamp-1 flex items-center gap-1"
                onClick={() => status === "NEW" && updateStatus("VIEWED")}
              >
                {job.title}
                <ExternalLink size={12} className="shrink-0 opacity-50" />
              </a>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusCfg.class)}>
                {statusCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              {job.budget && (
                <span className="font-medium text-green-700">{job.budget}</span>
              )}
              {job.category && <span>{job.category}</span>}
              {job.country && <span>{job.country}</span>}
              <span>{formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}</span>
            </div>

            {job.matchedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {job.matchedKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}

            {job.description && (
              <div className="mt-2">
                <p className={cn("text-xs text-slate-600", !expanded && "line-clamp-2")}>
                  {job.description.replace(/<[^>]+>/g, "")}
                </p>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs text-blue-500 hover:underline mt-0.5"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 mt-3">
          <Button
            size="sm"
            variant={status === "SAVED" ? "default" : "outline"}
            onClick={() => updateStatus("SAVED")}
            disabled={!!loading}
            className="h-7 text-xs gap-1"
          >
            <Bookmark size={12} />
            Save
          </Button>
          <Button
            size="sm"
            variant={status === "VIEWED" ? "default" : "outline"}
            onClick={() => updateStatus("VIEWED")}
            disabled={!!loading}
            className="h-7 text-xs gap-1"
          >
            <Eye size={12} />
            View
          </Button>
          <Button
            size="sm"
            variant={status === "APPLIED" ? "default" : "outline"}
            onClick={() => updateStatus("APPLIED")}
            disabled={!!loading}
            className="h-7 text-xs gap-1"
          >
            <CheckCircle size={12} />
            Applied
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus("SKIPPED")}
            disabled={!!loading}
            className="h-7 text-xs gap-1 text-slate-400 hover:text-slate-600"
          >
            <SkipForward size={12} />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
