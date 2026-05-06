"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function FetchJobsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fetch-jobs", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed");

      toast.success(`Fetched ${data.fetched} jobs — ${data.newJobs} new`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleFetch} disabled={loading} className="gap-2">
      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
      {loading ? "Fetching..." : "Fetch Jobs"}
    </Button>
  );
}
