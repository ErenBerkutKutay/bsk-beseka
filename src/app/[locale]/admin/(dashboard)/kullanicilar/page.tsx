"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<
    { id: string; email: string; name: string | null; role: string; company: string | null }[]
  >([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    company: "",
    role: "B2B",
  });

  async function load() {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ email: "", password: "", name: "", company: "", role: "B2B" });
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kullanıcılar</h1>
      <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
        <div>
          <Label>E-posta</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Şifre</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Ad</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Şirket</Label>
          <Input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <div>
          <Label>Rol</Label>
          <select
            className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="B2B">B2B</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit">Kullanıcı Ekle</Button>
        </div>
      </form>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="rounded-lg border bg-white px-4 py-3">
            <div className="font-medium">{user.email}</div>
            <div className="text-sm text-zinc-500">
              {user.name} · {user.role} {user.company && `· ${user.company}`}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
