"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getStoredUser } from "@/lib/auth";
import api from "@/lib/api";
import {
  IndianRupee,
  CheckCircle,
  Clock,
  Download,
  Loader2,
} from "lucide-react";

interface Commission {
  id: string;
  commissionAmount: number;
  status: "PENDING" | "RELEASED";
  createdAt: string;
  releasedAt: string | null;
  booking: {
    bookingCode: string;
    shootDate: string;
    service: { name: string };
  };
}

interface Summary {
  total: number;
  pending: number;
  released: number;
  count: number;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [agentProfileId, setAgentProfileId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.profileId) {
      setLoading(false);
      return;
    }
    setAgentProfileId(user.profileId);

    Promise.all([
      api.get<{ commissions: Commission[] }>(`/agents/${user.profileId}`),
      api.get<Summary>(`/agents/${user.profileId}/commission-summary`),
    ])
      .then(([agentRes, summaryRes]) => {
        setCommissions(agentRes.data.commissions ?? []);
        setSummary(summaryRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadStatement = async () => {
    if (!agentProfileId) return;
    setDownloading(true);
    try {
      const res = await api.get(
        `/agents/${agentProfileId}/commission-statement`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `commission-statement.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate statement. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-[#E5312A]" />
        <span className="ml-3 text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
          Loading commissions…
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Referral Agent
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            My Commissions
          </h1>
        </div>
        {agentProfileId && (
          <button
            onClick={downloadStatement}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#E5312A] hover:bg-[#CC2A24] text-white text-xs font-bold px-4 py-2.5 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {downloading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Download size={13} /> Download Statement
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Total Earned",
              value: summary.total,
              icon: IndianRupee,
              cls: "text-green-600 dark:text-green-400",
              bg: "bg-green-50 dark:bg-green-900/20",
            },
            {
              label: "Pending Payout",
              value: summary.pending,
              icon: Clock,
              cls: "text-yellow-600 dark:text-yellow-400",
              bg: "bg-yellow-50 dark:bg-yellow-900/20",
            },
            {
              label: "Released",
              value: summary.released,
              icon: CheckCircle,
              cls: "text-[#E5312A]",
              bg: "bg-[#E5312A]/10",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-5"
              >
                <div
                  className={`w-9 h-9 flex items-center justify-center mb-3 ${card.bg}`}
                >
                  <Icon size={16} className={card.cls} />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  ₹{Number(card.value).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a] mt-0.5">
                  {card.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Commission History */}
      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#181818]">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
            Commission History
          </p>
        </div>

        {commissions.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
            No commissions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <tr>
                  {[
                    "Booking",
                    "Service",
                    "Shoot Date",
                    "Amount",
                    "Status",
                    "Released On",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] bg-[#f5f5f5] dark:bg-[#181818]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono text-xs text-[#6b6b6b] dark:text-[#8a8a8a]">
                      {c.booking?.bookingCode}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {c.booking?.service?.name}
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a] text-xs">
                      {c.booking?.shootDate
                        ? new Date(c.booking.shootDate).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : ""}
                    </td>
                    <td className="px-4 py-3 font-black text-gray-900 dark:text-white">
                      ₹{Number(c.commissionAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-black tracking-[0.1em] uppercase px-2 py-1 ${c.status === "RELEASED" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a] text-xs">
                      {c.releasedAt
                        ? new Date(c.releasedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
