"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  careerTrack: string;
  managerId: string | null;
  manager: Manager | null;
  createdAt: string;
}

const ROLES = ["EMPLOYEE", "MANAGER", "ADMIN"] as const;
const CAREER_TRACKS = [
  "itInfrastructureEngineer",
  "itSecurityEngineer",
  "itSpecialist",
  "itSecurityTeamLead",
  "itSecurityFamilyLead",
  "cloudEngineer",
  "helpDesk",
  "networkEngineer",
] as const;

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: "bg-blue-100 text-blue-800",
  MANAGER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-red-100 text-red-800",
};

function formatTrack(track: string) {
  return track.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

interface EditState {
  employeeId: string;
  name: string;
  role: string;
  careerTrack: string;
  managerId: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("EMPLOYEE");
  const [newTrack, setNewTrack] = useState<string>(CAREER_TRACKS[0]);
  const [newManagerId, setNewManagerId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function fetchEmployees() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load employees");
      }
      setEmployees(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          careerTrack: newTrack,
          managerId: newManagerId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("EMPLOYEE");
      setNewTrack(CAREER_TRACKS[0]);
      setNewManagerId("");
      await fetchEmployees();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(emp: Employee) {
    setEditState({
      employeeId: emp.id,
      name: emp.name,
      role: emp.role,
      careerTrack: emp.careerTrack,
      managerId: emp.managerId || "",
    });
    setSaveError("");
  }

  async function handleSave() {
    if (!editState) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/admin/employees/${editState.employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editState.name,
          role: editState.role,
          careerTrack: editState.careerTrack,
          managerId: editState.managerId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update employee");
      setEditState(null);
      await fetchEmployees();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const managersAndAdmins = employees.filter(
    (e) => e.role === "MANAGER" || e.role === "ADMIN"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-muted-foreground mt-1">Manage employee accounts, roles, and assignments</p>
      </div>

      {/* Add Employee */}
      <Card>
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
          <CardDescription>Create a new employee account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Initial password"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-role">Role</Label>
              <select
                id="new-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-track">Career Track</Label>
              <select
                id="new-track"
                value={newTrack}
                onChange={(e) => setNewTrack(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                {CAREER_TRACKS.map((t) => (
                  <option key={t} value={t}>{formatTrack(t)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-manager">Manager (optional)</Label>
              <select
                id="new-manager"
                value={newManagerId}
                onChange={(e) => setNewManagerId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">— No manager —</option>
                {managersAndAdmins.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4">
              <Button type="submit" disabled={adding}>
                {adding ? "Adding..." : "Add Employee"}
              </Button>
              {addError && <p className="text-sm text-red-600">{addError}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Employees table */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Name</th>
                    <th className="text-left py-2 pr-4 font-medium">Email</th>
                    <th className="text-left py-2 pr-4 font-medium">Role</th>
                    <th className="text-left py-2 pr-4 font-medium">Career Track</th>
                    <th className="text-left py-2 pr-4 font-medium">Manager</th>
                    <th className="text-left py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const isEditing = editState?.employeeId === emp.id;
                    return (
                      <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4 font-medium">
                          {isEditing ? (
                            <Input
                              value={editState.name}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, name: e.target.value } : s)
                              }
                              className="h-8 text-sm"
                            />
                          ) : (
                            emp.name
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{emp.email}</td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <select
                              value={editState.role}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, role: e.target.value } : s)
                              }
                              className="h-8 px-2 rounded border border-input bg-background text-sm"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[emp.role] ?? "bg-gray-100"}`}
                            >
                              {emp.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <select
                              value={editState.careerTrack}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, careerTrack: e.target.value } : s)
                              }
                              className="h-8 px-2 rounded border border-input bg-background text-sm"
                            >
                              {CAREER_TRACKS.map((t) => (
                                <option key={t} value={t}>{formatTrack(t)}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-muted-foreground">{formatTrack(emp.careerTrack)}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <select
                              value={editState.managerId}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, managerId: e.target.value } : s)
                              }
                              className="h-8 px-2 rounded border border-input bg-background text-sm"
                            >
                              <option value="">— No manager —</option>
                              {managersAndAdmins
                                .filter((m) => m.id !== emp.id)
                                .map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                          ) : (
                            <span className="text-muted-foreground">
                              {emp.manager?.name ?? "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSave} disabled={saving}>
                                  {saving ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditState(null); setSaveError(""); }}
                                  disabled={saving}
                                >
                                  Cancel
                                </Button>
                              </div>
                              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEdit(emp)}>
                              Edit
                            </Button>
                          )}
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
