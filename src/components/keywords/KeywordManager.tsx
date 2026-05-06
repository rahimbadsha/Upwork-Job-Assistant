"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Keyword {
  id: string;
  text: string;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  initialKeywords: Keyword[];
}

export default function KeywordManager({ initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [newKeyword, setNewKeyword] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const addKeyword = async () => {
    const text = newKeyword.trim();
    if (!text) return;

    setLoading("add");
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setKeywords((prev) => {
        const existing = prev.findIndex((k) => k.id === data.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
      setNewKeyword("");
      toast.success(`Keyword "${text}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add keyword");
    } finally {
      setLoading(null);
    }
  };

  const addBulkKeywords = async () => {
    const texts = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (texts.length === 0) return;

    setLoading("bulk");
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: texts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setKeywords((prev) => {
        const merged = [...prev];
        for (const kw of data) {
          const idx = merged.findIndex((k) => k.id === kw.id);
          if (idx >= 0) merged[idx] = kw;
          else merged.push(kw);
        }
        return merged;
      });
      setBulkText("");
      setShowBulk(false);
      toast.success(`Added ${data.length} keywords`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add keywords");
    } finally {
      setLoading(null);
    }
  };

  const toggleKeyword = useCallback(async (kw: Keyword) => {
    setLoading(kw.id);
    try {
      const res = await fetch(`/api/keywords/${kw.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !kw.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setKeywords((prev) => prev.map((k) => (k.id === kw.id ? data : k)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(null);
    }
  }, []);

  const deleteKeyword = useCallback(async (id: string, text: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");

      setKeywords((prev) => prev.filter((k) => k.id !== id));
      toast.success(`Keyword "${text}" removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(null);
    }
  }, []);

  const activeCount = keywords.filter((k) => k.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keywords</h1>
          <p className="text-sm text-slate-500">
            {activeCount} active · {keywords.length} total
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBulk((v) => !v)}
          className="gap-2"
        >
          <Upload size={14} />
          Bulk Add
        </Button>
      </div>

      {/* Single add */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. React developer, Next.js, TypeScript..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            />
            <Button onClick={addKeyword} disabled={loading === "add" || !newKeyword.trim()} className="gap-2">
              <Plus size={16} />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk add */}
      {showBulk && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Bulk Add Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full h-32 p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={"React developer\nNext.js\nTypeScript\nNode.js backend, Python, FastAPI"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <p className="text-xs text-slate-400">Separate by newlines or commas</p>
            <div className="flex gap-2">
              <Button onClick={addBulkKeywords} disabled={loading === "bulk" || !bulkText.trim()} size="sm">
                {loading === "bulk" ? "Adding..." : "Add All"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Keyword list */}
      {keywords.length === 0 ? (
        <p className="text-center text-slate-400 py-12 text-sm">
          No keywords yet. Add some to start finding jobs.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords
            .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
            .map((kw) => (
              <div
                key={kw.id}
                className={cn(
                  "flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border text-sm transition-opacity",
                  kw.isActive
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
                )}
              >
                <span>{kw.text}</span>
                <button
                  onClick={() => toggleKeyword(kw)}
                  disabled={loading === kw.id}
                  className="p-0.5 hover:text-blue-600 transition-colors"
                  title={kw.isActive ? "Disable" : "Enable"}
                >
                  {kw.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => deleteKeyword(kw.id, kw.text)}
                  disabled={loading === kw.id}
                  className="p-0.5 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
