"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Cycle {
  id: string;
  name: string;
  status: "OPEN" | "REVIEWING" | "CALIBRATING" | "CLOSED";
  startDate: string;
  endDate: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  REVIEWING: "bg-blue-100 text-blue-800",
  CALIBRATING: "bg-yellow-100 text-yellow-800",
  CLOSED: "bg-gray-100 text-gray-700",
};

const NEXT_STATE: Record<string, string | null> = {
  OPEN: "REVIEWING",
  REVIEWING: "CALIBRATING",
  CALIBRATING: "CLOSED (via /api/calibration/lock)",
  CLOSED: null,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Advance state
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [advanceErrors, setAdvanceErrors] = useState<Record<string, string>>({});

  async function fetchCycles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load cycles");
      }
      setCycles(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCycles();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create cycle");
      setName("");
      setStartDate("");
      setEndDate("");
      await fetchCycles();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function handleAdvance(cycleId: string) {
    setAdvancing(cycleId);
    setAdvanceErrors((prev) => ({ ...prev, [cycleId]: "" }));
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/advance`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance cycle");
      await fetchCycles();
    } catch (e: unknown) {
      setAdvanceErrors((prev) => ({
        ...prev,
        [cycleId]: e instanceof Error ? e.message : "Unknown error",
      }));
    } finally {
      setAdvancing(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assessment Cycles</h1>
        <p className="text-muted-foreground mt-1">Manage assessment cycles and their lifecycle</p>
      </div>

      {/* Create new cycle */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Cycle</CardTitle>
          <CardDescription>
            Only one active cycle can exist at a time. Close the current cycle before creating a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="cycle-name">Cycle Name</Label>
              <Input
                id="cycle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 2026"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-4">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Cycle"}
              </Button>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cycles table */}
      <Card>
        <CardHeader>
          <CardTitle>All Cycles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : cycles.length === 0 ? (
            <p className="text-muted-foreground">No cycles found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Name</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Start Date</th>
                    <th className="text-left py-2 pr-4 font-medium">End Date</th>
                    <th className="text-left py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((cycle) => {
                    const nextState = NEXT_STATE[cycle.status];
                    const isAdvancing = advancing === cycle.id;
                    const advErr = advanceErrors[cycle.id];
                    const canAdvance = cycle.status !== "CLOSED" && cycle.status !== "CALIBRATING";

                    return (
                      <tr key={cycle.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4 font-medium">{cycle.name}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[cycle.status] ?? "bg-gray-100"}`}
                          >
                            {cycle.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDate(cycle.startDate)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDate(cycle.endDate)}</td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1">
                            {nextState ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={canAdvance ? "default" : "outline"}
                                  disabled={!canAdvance || isAdvancing}
                                  onClick={() => canAdvance && handleAdvance(cycle.id)}
                                  title={
                                    cycle.status === "CALIBRATING"
                                      ? "Use /api/calibration/lock to close this cycle"
                                      : `Advance to ${nextState}`
                                  }
                                >
                                  {isAdvancing
                                    ? "Advancing..."
                                    : cycle.status === "CALIBRATING"
                                    ? "Close via calibration/lock"
                                    : `→ ${nextState}`}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No further transitions</span>
                            )}
                            {advErr && (
                              <p className="text-xs text-red-600 max-w-xs">{advErr}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
