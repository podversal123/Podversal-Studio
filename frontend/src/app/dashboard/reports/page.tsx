"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, BarChart3, TrendingUp, FileText } from "lucide-react";
import api from "@/lib/api";

type ReportType = "bookings" | "revenue" | "gst";

const REPORT_TABS: {
  key: ReportType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    key: "bookings",
    label: "Booking Report",
    icon: BarChart3,
    desc: "All bookings with status & amounts",
  },
  {
    key: "revenue",
    label: "Revenue Report",
    icon: TrendingUp,
    desc: "Payments collected by mode & type",
  },
  {
    key: "gst",
    label: "GST Report",
    icon: FileText,
    desc: "Invoices with taxable & GST split",
  },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  IN_PROGRESS:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  ADVANCE_PAID:
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  APPROVED:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  REQUEST: "bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400",
  CHECKING:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  QUOTED:
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
};

const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [type, setType] = useState<ReportType>("bookings");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generate = async () => {
    setLoading(true);
    setData(null);
    try {
      const r = await api.get(`/reports/${type}?from=${from}&to=${to}`);
      setData(r.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/reports/${type}/export`, {
        params: { from, to },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${from}-to-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const changeType = (t: ReportType) => {
    setType(t);
    setData(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
          Analytics
        </p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Reports
        </h1>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {REPORT_TABS.map(({ key, label, icon: Icon, desc }) => (
          <button
            key={key}
            onClick={() => changeType(key)}
            className={`text-left p-4 border transition-colors ${
              type === key
                ? "border-[#E5312A] bg-[#E5312A]/5 dark:bg-[#E5312A]/10"
                : "border-[#e5e5e5] dark:border-[#2a2a2a] hover:border-gray-400 dark:hover:border-[#444]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                size={14}
                className={
                  type === key
                    ? "text-[#E5312A]"
                    : "text-[#aaa] dark:text-[#555]"
                }
              />
              <span
                className={`text-sm font-black ${type === key ? "text-gray-900 dark:text-white" : "text-[#6b6b6b] dark:text-[#8a8a8a]"}`}
              >
                {label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Date Range + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1">
            <label className="block text-[10px] text-[#aaa] dark:text-[#555] mb-1.5">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <span className="text-[#aaa] dark:text-[#555] mt-5"></span>
          <div className="flex-1">
            <label className="block text-[10px] text-[#aaa] dark:text-[#555] mb-1.5">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary px-4 whitespace-nowrap"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
        {data && (
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-gray-700 dark:text-[#a0a0a0] hover:border-gray-400 dark:hover:border-[#444] transition-colors whitespace-nowrap"
          >
            <Download size={14} />
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        )}
      </div>

      {/* ── Booking Report ── */}
      {data && type === "bookings" && (
        <div className="space-y-4">
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] px-5 py-4 flex flex-wrap gap-6">
            <div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {data.summary.total}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                Total
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-green-600 dark:text-green-400">
                {data.summary.completed}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                Completed
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {data.summary.inProgress}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                In Progress
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-[#E5312A]">
                {data.summary.cancelled}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                Cancelled
              </span>
            </div>
          </div>
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden md:table-cell text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                  {data.bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-[#aaa] dark:text-[#555] py-10"
                      >
                        No bookings in this range
                      </td>
                    </tr>
                  ) : (
                    data.bookings.map((b: any) => (
                      <tr
                        key={b.id}
                        className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                          {b.bookingCode}
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {b.service?.name ?? ""}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {b.customer?.user?.name ?? b.customerName ?? ""}
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {new Date(b.shootDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-black tracking-[0.06em] uppercase px-2 py-1 ${STATUS_COLORS[b.status] ?? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400"}`}
                          >
                            {b.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-right font-bold text-gray-900 dark:text-white">
                          {fmt(b.totalAmount ?? 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Revenue Report ── */}
      {data && type === "revenue" && (
        <div className="space-y-4">
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] px-5 py-4 flex flex-wrap gap-6 items-center">
            <div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {fmt(data.totalRevenue)}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                Collected
              </span>
            </div>
            {Object.entries(data.byMode).map(([mode, amt]) => (
              <div key={mode}>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {fmt(amt as number)}
                </span>
                <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                  {mode}
                </span>
              </div>
            ))}
          </div>
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                  {data.payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-[#aaa] dark:text-[#555] py-10"
                      >
                        No payments in this range
                      </td>
                    </tr>
                  ) : (
                    data.payments.map((p: any) => (
                      <tr
                        key={p.id}
                        className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                          {p.booking.bookingCode}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {p.booking.customer?.user?.name ?? ""}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black tracking-[0.06em] uppercase bg-[#f5f5f5] dark:bg-[#2a2a2a] text-gray-600 dark:text-[#8a8a8a] px-2 py-1">
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {p.mode}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                          {fmt(p.amount)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── GST Report ── */}
      {data && type === "gst" && (
        <div className="space-y-4">
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] px-5 py-4 flex flex-wrap gap-6">
            <div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {fmt(data.totalTaxable)}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                Taxable
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {fmt(data.totalGst)}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                GST 18%
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-green-600 dark:text-green-400">
                {fmt(data.totalAmount)}
              </span>
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] ml-2">
                Total
              </span>
            </div>
          </div>
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3 hidden md:table-cell">Service</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">GST</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                  {data.invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-[#aaa] dark:text-[#555] py-10"
                      >
                        No GST invoices in this range
                      </td>
                    </tr>
                  ) : (
                    data.invoices.map((inv: any) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {inv.booking.customer?.user?.name ?? ""}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {inv.booking.service?.name ?? ""}
                        </td>
                        <td className="px-4 py-3 text-right text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {fmt(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600 dark:text-orange-400">
                          {fmt(inv.gstAmount ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                          {fmt(inv.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
            Select a report type and date range, then click Generate Report
          </p>
        </div>
      )}
    </div>
  );
}
