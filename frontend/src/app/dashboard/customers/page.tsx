"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/customers")
      .then((r) => setCustomers(r.data))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  const openCustomer = async (c: any) => {
    setSelected(c);
    setStats(null);
    setNotes(c.internalNotes ?? "");
    try {
      const r = await api.get(`/customers/${c.id}/stats`);
      setStats(r.data);
    } catch {}
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/customers/${selected.id}`, { internalNotes: notes });
      setSelected((prev: any) => ({ ...prev, internalNotes: notes }));
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter((c) =>
    [c.user?.name, c.user?.email, c.user?.phone, c.companyName].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Customer Management
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {customers.length} customer{customers.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-72"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-2 border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Contact</th>
                    <th className="px-4 py-3 hidden md:table-cell">Company</th>
                    <th className="px-4 py-3">Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-[#aaa] dark:text-[#555] py-10"
                      >
                        {search
                          ? "No customers match your search"
                          : "No customers yet"}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => openCustomer(c)}
                        className={`cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors ${
                          selected?.id === c.id
                            ? "bg-[#E5312A]/5 dark:bg-[#E5312A]/10"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {c.user?.name ?? ""}
                          </p>
                          <p className="text-[10px] text-[#aaa] dark:text-[#555] sm:hidden mt-0.5">
                            {c.user?.email}
                          </p>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <p className="text-[#6b6b6b] dark:text-[#8a8a8a]">
                            {c.user?.email ?? ""}
                          </p>
                          {c.user?.phone && (
                            <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-0.5">
                              {c.user.phone}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {c.companyName ?? ""}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-[#f5f5f5] dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-black text-xs">
                            {c._count?.bookings ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Detail Panel */}
          <div>
            {selected ? (
              <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] space-y-4 p-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-white">
                      {selected.user?.name}
                    </h2>
                    <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a] mt-0.5">
                      {selected.companyName ??
                        selected.category ??
                        "Individual"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#aaa] hover:text-gray-900 dark:hover:text-white text-xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Contact info */}
                <div className="space-y-2 text-sm border-t border-[#f0f0f0] dark:border-[#1e1e1e] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[#aaa] dark:text-[#555]">Email</span>
                    <span className="font-bold text-gray-900 dark:text-white text-right truncate ml-3">
                      {selected.user?.email}
                    </span>
                  </div>
                  {selected.user?.phone && (
                    <div className="flex justify-between">
                      <span className="text-[#aaa] dark:text-[#555]">
                        Phone
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selected.user.phone}
                      </span>
                    </div>
                  )}
                  {selected.gstNumber && (
                    <div className="flex justify-between">
                      <span className="text-[#aaa] dark:text-[#555]">GST</span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono text-xs">
                        {selected.gstNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#aaa] dark:text-[#555]">
                      Category
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {selected.category ?? "INDIVIDUAL"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-[#f0f0f0] dark:border-[#1e1e1e] pt-3">
                  {stats ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] p-2 text-center">
                        <div className="text-xl font-black text-gray-900 dark:text-white">
                          {stats.totalBookings}
                        </div>
                        <div className="text-[10px] text-[#aaa] dark:text-[#555] uppercase tracking-wide mt-0.5">
                          Total
                        </div>
                      </div>
                      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] p-2 text-center">
                        <div className="text-xl font-black text-green-600 dark:text-green-400">
                          {stats.completedBookings}
                        </div>
                        <div className="text-[10px] text-[#aaa] dark:text-[#555] uppercase tracking-wide mt-0.5">
                          Done
                        </div>
                      </div>
                      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] p-2 text-center">
                        <div className="text-sm font-black text-[#E5312A]">
                          ₹{Number(stats.totalSpent).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-[#aaa] dark:text-[#555] uppercase tracking-wide mt-0.5">
                          Spent
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-12 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Bookings */}
                {selected.bookings?.length > 0 && (
                  <div className="border-t border-[#f0f0f0] dark:border-[#1e1e1e] pt-3 space-y-1">
                    <p className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] mb-2">
                      Recent Bookings
                    </p>
                    {selected.bookings.slice(0, 5).map((b: any) => (
                      <div key={b.id} className="flex justify-between text-xs">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {b.bookingCode}
                        </span>
                        <span className="text-[#aaa] dark:text-[#555]">
                          {new Date(b.shootDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Internal Notes */}
                <div className="border-t border-[#f0f0f0] dark:border-[#1e1e1e] pt-3 space-y-2">
                  <p className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555]">
                    Internal Notes
                  </p>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Private notes about this customer..."
                    className="input-field resize-none text-sm"
                  />
                  <button
                    onClick={saveNotes}
                    disabled={saving}
                    className="w-full bg-[#E5312A] hover:bg-[#CC2A24] text-white text-sm font-bold py-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Notes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
                <p className="text-sm text-[#aaa] dark:text-[#555]">
                  Select a customer to view details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
