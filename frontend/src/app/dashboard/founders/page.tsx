"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, Mail, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatDateShort, formatTime12 } from "@/components/founders/founders-api";

interface FounderRow {
  id: string;
  bookingCode: string;
  companyName: string;
  name: string;
  email: string;
  phone: string;
  referredBy: string;
  referrerName: string;
  teamName: string;
  shootDate: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  confirmationSentAt: string | null;
  createdAt: string;
}

interface Counts {
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}
interface Leaderboard {
  totals: Counts;
  teams: (Counts & {
    id: string;
    name: string;
    members: (Counts & { id: string; name: string })[];
  })[];
}

const STATUS_CLS: Record<FounderRow["status"], string> = {
  CONFIRMED: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  COMPLETED: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

const th =
  "px-4 py-3 text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#888] dark:text-[#999]";

export default function FoundersAdminPage() {
  const [rows, setRows] = useState<FounderRow[]>([]);
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [status, setStatus] = useState("");
  const [member, setMember] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    setIsSuperAdmin(getStoredUser()?.role === "SUPER_ADMIN");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (member) params.referredBy = member;
      if (date) params.date = date;
      const list = await api.get<FounderRow[]>("/founders/admin/bookings", { params });
      setRows(list.data);
    } catch {
      toast.error("Failed to load founder bookings");
    } finally {
      setLoading(false);
    }
  }, [status, member, date]);

  const loadBoard = useCallback(async () => {
    try {
      const res = await api.get<Leaderboard>("/founders/admin/leaderboard");
      setBoard(res.data);
    } catch {
      setBoard(null); // not a Super Admin: incentives stay hidden
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const refreshAll = () => {
    load();
    loadBoard();
  };

  const changeStatus = async (id: string, next: "COMPLETED" | "CANCELLED") => {
    setBusyId(id);
    try {
      await api.patch(`/founders/admin/bookings/${id}/status`, { status: next });
      toast.success(next === "COMPLETED" ? "Marked as completed" : "Booking cancelled");
      setConfirmCancelId(null);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Could not update booking");
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/founders/admin/bookings/${id}/resend-confirmation`);
      toast.success("Confirmation email sent");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Email failed to send");
    } finally {
      setBusyId(null);
    }
  };

  const members = useMemo(
    () => board?.teams.flatMap((t) => t.members.map((m) => ({ ...m, team: t.name }))) ?? [],
    [board],
  );

  // Filter options when the leaderboard isn't available (Studio Manager)
  const memberOptions = useMemo(() => {
    if (members.length) return members.map((m) => ({ id: m.id, label: `${m.name} (${m.team})` }));
    const seen = new Map<string, string>();
    rows.forEach((r) => seen.set(r.referredBy, `${r.referrerName} (${r.teamName})`));
    return Array.from(seen, ([id, label]) => ({ id, label }));
  }, [members, rows]);

  const exportCsv = () => {
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Booking ID", "Date", "Start", "End", "Company", "Name", "Phone", "Email", "Invited by", "Team", "Status", "Booked on"];
    const lines = rows.map((r) =>
      [
        r.bookingCode, r.shootDate, r.startTime, r.endTime, r.companyName, r.name, r.phone,
        r.email, r.referrerName, r.teamName, r.status,
        new Date(r.createdAt).toLocaleString("en-IN"),
      ].map(esc).join(","),
    );
    const blob = new Blob(["﻿" + [header.map(esc).join(","), ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `founder-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Campaign
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Founders Podcast
          </h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#b0b0b0] mt-1">
            Free founder sessions booked from the invitation page.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 border border-[#e5e5e5] dark:border-[#2a2a2a] px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#181818]"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="btn-primary !w-auto flex items-center gap-2"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Incentive leaderboard: Super Admin only (the API enforces this too) */}
      {isSuperAdmin && board && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Bookings counted", board.totals.total],
              ["Upcoming", board.totals.confirmed],
              ["Completed", board.totals.completed],
              ["Cancelled (not counted)", board.totals.cancelled],
            ].map(([label, value]) => (
              <div key={label as string} className="border border-[#e5e5e5] dark:border-[#2a2a2a] p-4">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-[#6b6b6b] dark:text-[#b0b0b0] mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {board.teams.map((team, i) => (
              <div key={team.id} className="border border-[#e5e5e5] dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
                  <div>
                    <p className="font-black text-gray-900 dark:text-white">{team.name}</p>
                    <p className="text-xs text-[#6b6b6b] dark:text-[#b0b0b0]">
                      {i === 0 && team.total > 0 ? "Leading" : `Rank ${i + 1}`}
                    </p>
                  </div>
                  <p className="text-3xl font-black text-[#E5312A]">{team.total}</p>
                </div>
                <ul className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                  {team.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-900 dark:text-white">{m.name}</span>
                      <span className="text-[#6b6b6b] dark:text-[#b0b0b0]">
                        <strong className="text-gray-900 dark:text-white">{m.total}</strong>
                        {m.completed > 0 && ` · ${m.completed} done`}
                        {m.cancelled > 0 && ` · ${m.cancelled} cancelled`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field !w-auto" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={member} onChange={(e) => setMember(e.target.value)} className="input-field !w-auto" aria-label="Filter by who invited">
          <option value="">Everyone</option>
          {memberOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !w-auto" aria-label="Filter by date" />
        {(status || member || date) && (
          <button
            onClick={() => { setStatus(""); setMember(""); setDate(""); }}
            className="text-sm font-bold text-[#E5312A] px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bookings */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] py-16 text-center">
          <p className="font-bold text-gray-900 dark:text-white">No founder bookings yet</p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#b0b0b0] mt-1">
            Bookings made on the invitation page will show up here.
          </p>
        </div>
      ) : (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
              <tr>
                <th className={th}>When</th>
                <th className={th}>Company</th>
                <th className={th}>Contact</th>
                <th className={th}>Invited by</th>
                <th className={th}>Status</th>
                <th className={th}>Email</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
              {rows.map((r) => (
                <tr key={r.id} className="align-top hover:bg-[#fafafa] dark:hover:bg-[#161616]">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-bold text-gray-900 dark:text-white">{formatDateShort(r.shootDate)}</p>
                    <p className="text-xs text-[#6b6b6b] dark:text-[#b0b0b0]">
                      {formatTime12(r.startTime)} – {formatTime12(r.endTime)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900 dark:text-white">{r.companyName}</p>
                    <p className="text-xs text-[#6b6b6b] dark:text-[#b0b0b0]">{r.bookingCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-white">{r.name}</p>
                    <a href={`tel:${r.phone}`} className="block text-xs text-[#6b6b6b] dark:text-[#b0b0b0] hover:text-[#E5312A]">{r.phone}</a>
                    <a href={`mailto:${r.email}`} className="block text-xs text-[#6b6b6b] dark:text-[#b0b0b0] hover:text-[#E5312A] break-all">{r.email}</a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-900 dark:text-white">{r.referrerName}</p>
                    <p className="text-xs text-[#6b6b6b] dark:text-[#b0b0b0]">{r.teamName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-[10px] font-black tracking-[0.08em] uppercase ${STATUS_CLS[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.confirmationSentAt ? (
                      <span className="text-green-600 dark:text-green-400">Sent</span>
                    ) : r.status === "CANCELLED" ? (
                      <span className="text-[#888]">—</span>
                    ) : (
                      <span className="font-bold text-[#E5312A]">Not sent</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "CONFIRMED" && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {confirmCancelId === r.id ? (
                          <>
                            <span className="text-xs text-[#6b6b6b] dark:text-[#b0b0b0]">Cancel and email the client?</span>
                            <button disabled={busyId === r.id} onClick={() => changeStatus(r.id, "CANCELLED")} className="px-3 py-1.5 bg-[#E5312A] text-white text-xs font-bold disabled:opacity-50">Yes, cancel</button>
                            <button onClick={() => setConfirmCancelId(null)} className="px-3 py-1.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-xs font-bold text-gray-900 dark:text-white">Keep</button>
                          </>
                        ) : (
                          <>
                            {!r.confirmationSentAt && (
                              <button disabled={busyId === r.id} onClick={() => resend(r.id)} className="flex items-center gap-1 px-3 py-1.5 border border-[#E5312A]/40 text-[#E5312A] text-xs font-bold disabled:opacity-50">
                                <Mail size={12} /> Resend
                              </button>
                            )}
                            <button disabled={busyId === r.id} onClick={() => changeStatus(r.id, "COMPLETED")} className="px-3 py-1.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-xs font-bold text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#181818] disabled:opacity-50">
                              Mark done
                            </button>
                            <button onClick={() => setConfirmCancelId(r.id)} className="px-3 py-1.5 text-xs font-bold text-[#E5312A] hover:bg-[#E5312A]/5">
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
