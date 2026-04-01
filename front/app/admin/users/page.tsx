'use client';

import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/services/api';
import type { AuthUser } from '@/types/user';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AuthUser[]>('/users');
      setUsers(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const removeUser = async (id: string) => {
    if (!window.confirm("Rostdan ham ushbu foydalanuvchini o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/users/${id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="section-shell py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl text-ink">Foydalanuvchilar boshqaruvi</h1>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-6 h-[400px] animate-pulse rounded-xl bg-sand" />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-br from-white via-sky-50/70 to-emerald-50/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink/85">
              <thead className="bg-gradient-to-r from-sky-100/80 via-indigo-50/80 to-emerald-100/70 text-xs uppercase text-ink/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ism</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Telefon</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70">
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`${index % 2 === 0 ? 'bg-white/80' : 'bg-sky-50/70'} transition-colors hover:bg-emerald-50/60`}
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-[11px] font-bold uppercase text-white">
                          {(user.name ?? user.email ?? 'U').trim().charAt(0)}
                        </span>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                        {user.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'SUPERADMIN' ? (
                        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          SUPERADMIN
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => void updateRole(user.id, e.target.value)}
                          className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'SUPERADMIN' && (
                        <button
                          onClick={() => removeUser(user.id)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                        >
                          O&apos;chirish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-6 text-center text-ink/60">
              Foydalanuvchilar topilmadi
            </div>
          )}
        </div>
      )}
    </div>
  );
}
