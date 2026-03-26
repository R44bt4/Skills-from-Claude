"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalibrationKPIs } from "@/components/calibration/calibration-kpis";
import { TeamGrid, TeamEntry } from "@/components/calibration/team-grid";
import { Button } from "@/components/ui/button";

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; teamData: TeamEntry[] }
  | { kind: "locked" };

export default function CalibrationPage() {
  const { data: session } = useSession();
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [teamData, setTeamData] = useState<TeamEntry[]>([]);
  const [lockPending, setLockPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/calibration/team");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({
            kind: "error",
            message: data.error ?? "Failed to load calibration data",
          });
          return;
        }
        const data: TeamEntry[] = await res.json();
        setTeamData(data);
        setState({ kind: "loaded", teamData: data });
      } catch {
        setState({ kind: "error", message: "Network error. Please try again." });
      }
    }
    load();
  }, []);

  async function handleCalibrate(
    assessmentId: string,
    finalLevels: Record<string, number>,
    finalProgress: number
  ) {
    try {
      const res = await fetch(`/api/calibration/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalScores: finalLevels, // levels used as scores for now
          finalLevels,
          finalProgress,
        }),
      });

      if (!res.ok) {
        console.error("Failed to save calibration");
        return;
      }

      // Update local teamData to reflect calibration
      setTeamData((prev) =>
        prev.map((entry) => {
          if (entry.assessmentId !== assessmentId) return entry;
          return {
            ...entry,
            hasCalibration: true,
            calibrationLevels: finalLevels,
            calibrationProgress: finalProgress,
          };
        })
      );
    } catch {
      console.error("Network error saving calibration");
    }
  }

  async function handleLock() {
    setLockPending(true);
    setLockError(null);
    try {
      const res = await fetch("/api/calibration/lock", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLockError(data.error ?? "Failed to lock calibration");
        setLockPending(false);
        return;
      }
      setState({ kind: "locked" });
    } catch {
      setLockError("Network error. Please try again.");
      setLockPending(false);
    }
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const allCalibrated =
    teamData.length > 0 && teamData.every((e) => e.hasCalibration);

  if (state.kind === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-2">
        <p className="text-red-700 font-medium">Something went wrong</p>
        <p className="text-sm text-red-600">{state.message}</p>
      </div>
    );
  }

  if (state.kind === "locked") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center space-y-2">
        <p className="text-green-700 font-semibold text-lg">
          Calibration locked. Growth plans are being generated.
        </p>
        <p className="text-sm text-green-600">
          The cycle has been closed. Growth plans will be available shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calibration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and finalize competency levels for your team.
        </p>
      </div>

      <CalibrationKPIs teamData={teamData} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Team Grid</h2>
        <p className="text-sm text-muted-foreground">
          Click any competency cell to cycle through levels 0–5. Changes are
          saved immediately.
        </p>
        <TeamGrid teamData={teamData} onCalibrate={handleCalibrate} />
      </section>

      {isAdmin && (
        <section className="space-y-3 border-t border-border pt-6">
          {lockError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{lockError}</p>
            </div>
          )}

          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!allCalibrated}
              variant="default"
            >
              Lock Calibration
            </Button>
          ) : (
            <div className="rounded-lg border border-border p-4 space-y-3 max-w-sm">
              <p className="text-sm font-medium text-foreground">
                Are you sure you want to lock calibration? This will close the
                cycle and begin generating growth plans.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleLock}
                  disabled={lockPending}
                  variant="default"
                >
                  {lockPending ? "Locking..." : "Confirm Lock"}
                </Button>
                <Button
                  onClick={() => setShowConfirm(false)}
                  disabled={lockPending}
                  variant="default"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!allCalibrated && (
            <p className="text-xs text-muted-foreground">
              All employees must be calibrated before locking.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
