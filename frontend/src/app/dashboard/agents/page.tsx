"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, X, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

interface Agent {
  id: string;
  agencyName: string;
  commissionRate: number;
  isActive: boolean;
  user: { name: string; email: string; phone?: string };
}

interface CommissionSummary {
  total: number;
  pending: number;
  released: number;
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit number")
    .optional()
    .or(z.literal("")),
  agencyName: z.string().min(1, "Agency / brand name is required"),
  commissionRate: z.coerce.number().min(0).max(100, "Max 100%"),
});

type Form = z.infer<typeof schema>;

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CommissionSummary>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { commissionRate: 10 },
  });

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  const load = () => {
    api
      .get<Agent[]>("/agents")
      .then(async (r) => {
        setAgents(r.data);
        const results = await Promise.allSettled(
          r.data.map((a) =>
            api
              .get<CommissionSummary>(`/agents/${a.id}/commission-summary`)
              .then((s) => ({ id: a.id, summary: s.data })),
          ),
        );
        const map: Record<string, CommissionSummary> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") map[r.value.id] = r.value.summary;
        });
        setSummaries(map);
      })
      .catch(() => toast.error("Failed to load agents"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (values: Form) => {
    setSaving(true);
    try {
      await api.post("/agents", {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        agencyName: values.agencyName,
        commissionRate: values.commissionRate,
      });
      toast.success("Agent added successfully");
      reset();
      setShowModal(false);
      setLoading(true);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add agent");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Referral Network
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Referral Agents
          </h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 w-auto shrink-0"
        >
          <Plus size={15} /> Add Agent
        </button>
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
      ) : agents.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <p className="font-bold text-gray-900 dark:text-white mb-1">
            No agents yet
          </p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
            Click "Add Agent" to onboard a referral agent.
          </p>
        </div>
      ) : (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Total Earned</th>
                <th className="px-4 py-3 hidden md:table-cell">Pending</th>
                <th className="px-4 py-3 hidden md:table-cell">Released</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
              {agents.map((a) => {
                const s = summaries[a.id];
                return (
                  <tr
                    key={a.id}
                    className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {a.user?.name ?? ""}
                      </p>
                      {a.agencyName && (
                        <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-0.5">
                          {a.agencyName}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-[#6b6b6b] dark:text-[#8a8a8a]">
                        {a.user?.email ?? ""}
                      </p>
                      {a.user?.phone && (
                        <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-0.5">
                          {a.user.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-black text-[#E5312A]">
                        {a.commissionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {s ? (
                          fmt(s.total)
                        ) : (
                          <span className="text-[#aaa] dark:text-[#555]"></span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {s ? (
                          fmt(s.pending)
                        ) : (
                          <span className="text-[#aaa] dark:text-[#555]"></span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {s ? (
                          fmt(s.released)
                        ) : (
                          <span className="text-[#aaa] dark:text-[#555]"></span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-black tracking-[0.08em] uppercase px-2 py-1 ${
                          a.isActive
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2a2a] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                Add Referral Agent
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  reset();
                }}
                className="text-[#aaa] hover:text-gray-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Full Name *
                </label>
                <input
                  {...register("name")}
                  className="input-field"
                  placeholder="Agent full name"
                />
                {errors.name && (
                  <p className="text-[#E5312A] text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Email *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="input-field"
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="text-[#E5312A] text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="Set initial password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#E5312A] text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Mobile Number
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="input-field"
                  placeholder="98xxxxxxxx (optional)"
                />
                {errors.phone && (
                  <p className="text-[#E5312A] text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Agency / Brand Name *
                </label>
                <input
                  {...register("agencyName")}
                  className="input-field"
                  placeholder="e.g. XYZ Productions"
                />
                {errors.agencyName && (
                  <p className="text-[#E5312A] text-xs mt-1">
                    {errors.agencyName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Commission Rate (%) *
                </label>
                <input
                  {...register("commissionRate")}
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input-field"
                  placeholder="e.g. 10"
                />
                {errors.commissionRate && (
                  <p className="text-[#E5312A] text-xs mt-1">
                    {errors.commissionRate.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-6 w-auto"
                >
                  {saving ? "Adding…" : "Add Agent"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    reset();
                  }}
                  className="px-5 py-2.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-semibold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
