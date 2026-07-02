"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  CreditCard,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { downloadInvoicePdf } from "@/lib/invoices";

type BookingStatus =
  | "REQUEST"
  | "CHECKING"
  | "QUOTED"
  | "APPROVED"
  | "ADVANCE_PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface Payment {
  id: string;
  type: string;
  mode: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  cloudinaryUrl: string | null;
}

interface Employee {
  id: string;
  user?: { name: string; email: string };
}

interface Booking {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string | null;
  shootDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  studioRequirements: string | null;
  equipmentRequired: string | null;
  additionalNotes: string | null;
  totalAmount: number | null;
  advanceAmount: number | null;
  discountAmount: number;
  service: { name: string; type: string } | null;
  createdBy: { id: string; name: string; email: string; role: string };
  customer: { user: { name: string; email: string; phone: string } } | null;
  agent: { user: { name: string; email: string } } | null;
  employee: { id: string; user: { name: string; email: string } } | null;
  payments: Payment[];
  invoices: Invoice[];
}

const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  REQUEST: {
    label: "Request",
    cls: "bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#6b6b6b] dark:text-[#8a8a8a]",
  },
  CHECKING: {
    label: "Checking",
    cls: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  },
  QUOTED: {
    label: "Quoted",
    cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  },
  APPROVED: { label: "Approved", cls: "bg-[#E5312A]/10 text-[#E5312A]" },
  ADVANCE_PAID: {
    label: "Advance Paid",
    cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  },
};

const quoteSchema = z.object({
  totalAmount: z.coerce.number().positive("Enter a valid total amount"),
  discountAmount: z.coerce.number().min(0).optional(),
});
type QuoteForm = z.infer<typeof quoteSchema>;

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111]">
      <div className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#181818]">
        <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
          {title}
        </p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-1.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
      <dt className="text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] sm:w-32 flex-shrink-0">
        {label}
      </dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white">
        {value || <span className="text-[#aaa] dark:text-[#555]"></span>}
      </dd>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = getStoredUser();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [assignEmp, setAssignEmp] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "STUDIO_MANAGER";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
  });

  const loadBooking = () => {
    Promise.all([
      api.get<Booking>(`/bookings/${id}`),
      isAdmin
        ? api.get<Employee[]>("/employees")
        : Promise.resolve({ data: [] as Employee[] }),
    ])
      .then(([b, e]) => {
        setBooking(b.data);
        setEmployees(e.data);
      })
      .catch(() => toast.error("Failed to load booking details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooking();
  }, [id, isAdmin]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { bookingId } = (e as CustomEvent).detail ?? {};
      if (bookingId === id) loadBooking();
    };
    window.addEventListener("podversal:live", handler);
    return () => window.removeEventListener("podversal:live", handler);
  }, [id]);

  const refresh = () =>
    api.get<Booking>(`/bookings/${id}`).then((r) => setBooking(r.data));

  // Returns whether the action succeeded so callers (e.g. the cancel-confirm
  // dialog) can decide what to do next instead of always assuming success.
  const action = async (
    fn: () => Promise<unknown>,
    successMsg: string,
  ): Promise<boolean> => {
    setActionLoading(true);
    try {
      await fn();
      await refresh();
      toast.success(successMsg);
      return true;
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : null;
      toast.error(msg ?? "Action failed");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayOnline = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Payment gateway unavailable. Try again later.");
        return;
      }

      const orderRes = await api.post("/payments/razorpay/order", {
        bookingId: id,
        amount: booking.advanceAmount ?? booking.totalAmount,
        type: "ADVANCE",
      });

      const { orderId, amount, currency, paymentId, keyId } = orderRes.data;

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: Math.round(Number(amount) * 100),
        currency,
        name: "Podversal Studio",
        description: `Slot Confirmation: ${booking.bookingCode}`,
        order_id: orderId,
        theme: { color: "#E5312A" },
        prefill: {
          name: booking.customerName ?? booking.customer?.user?.name ?? "",
          email: booking.customerEmail ?? booking.customer?.user?.email ?? "",
          contact: booking.customerPhone ?? booking.customer?.user?.phone ?? "",
        },
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.post("/payments/razorpay/verify", {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              bookingId: id,
              paymentDbId: paymentId,
            });
            await refresh();
            toast.success("Payment successful! Your studio slot is confirmed.");
          } catch {
            toast.error(
              `Payment received but verification failed. Share Payment ID ${resp.razorpay_payment_id} with the studio team.`,
            );
          }
        },
      });
      rzp.on("payment.failed", () =>
        toast.error("Payment failed. Please try a different payment method."),
      );
      rzp.open();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : null;
      toast.error(msg ?? "Could not initiate payment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-[#E5312A]" />
        <span className="ml-3 text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
          Loading booking…
        </span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-gray-900 dark:text-white mb-2">
          Booking not found
        </p>
        <button
          onClick={() => router.back()}
          className="text-[#E5312A] text-sm hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const { status } = booking;
  const meta = STATUS_META[status] ?? STATUS_META.REQUEST;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white transition-colors mb-3"
          >
            All Bookings
          </button>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Booking Details
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {booking.bookingCode}
          </h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {booking.service?.name}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1.5 text-[10px] font-black tracking-[0.15em] uppercase self-start ${meta.cls}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Customer: payment banner when APPROVED */}
      {user?.role === "CUSTOMER" &&
        status === "APPROVED" &&
        booking.totalAmount && (
          <div className="border border-[#E5312A] bg-[#E5312A]/5 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#E5312A] flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 dark:text-white mb-1">
                  Complete payment to lock your slot
                </h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-4">
                  Pay{" "}
                  <span className="font-black text-gray-900 dark:text-white">
                    ₹
                    {Number(
                      booking.advanceAmount ?? booking.totalAmount,
                    ).toLocaleString("en-IN")}
                  </span>{" "}
                  via UPI, card, or net banking to instantly confirm your studio
                  slot.
                </p>
                <button
                  onClick={handlePayOnline}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 bg-[#E5312A] hover:bg-[#CC2A24] text-white font-bold px-6 py-3 transition-colors disabled:opacity-50 text-sm"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Opening
                      payment…
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} /> Pay ₹
                      {Number(
                        booking.advanceAmount ?? booking.totalAmount,
                      ).toLocaleString("en-IN")}{" "}
                      Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Customer: slot confirmed after payment */}
      {user?.role === "CUSTOMER" && status === "ADVANCE_PAID" && (
        <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-4 flex items-center gap-3">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 dark:text-green-400">
            Advance payment received. Your slot is confirmed. We'll be in touch
            before the shoot day.
          </p>
        </div>
      )}

      {/* Customer: cancel confirmation inline */}
      {user?.role === "CUSTOMER" && confirmCancel && (
        <div className="border border-[#E5312A] bg-[#E5312A]/5 p-4 flex items-start gap-4">
          <AlertTriangle
            size={16}
            className="text-[#E5312A] flex-shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Cancel this booking?
            </p>
            <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a] mb-3">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  action(
                    () => api.patch(`/bookings/${id}/cancel`),
                    "Booking cancelled",
                  ).then((ok) => {
                    if (ok) setConfirmCancel(false);
                  })
                }
                disabled={actionLoading}
                className="px-4 py-2 bg-[#E5312A] text-white text-xs font-bold hover:bg-[#CC2A24] transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="px-4 py-2 border border-[#e5e5e5] dark:border-[#2a2a2a] text-xs font-bold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] transition-colors"
              >
                Keep booking
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-3 ${isAdmin ? "lg:grid-cols-3" : ""}`}
      >
        {/* Left  details */}
        <div className={`${isAdmin ? "lg:col-span-2" : ""} space-y-3`}>
          {/* Shoot Details */}
          <SectionCard title="Shoot Details">
            <dl>
              <DetailRow
                label="Date"
                value={new Date(booking.shootDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
              <DetailRow
                label="Time Slot"
                value={`${booking.startTime} – ${booking.endTime}`}
              />
              <DetailRow
                label="Duration"
                value={`${booking.durationHours} hours`}
              />
              <DetailRow label="Service" value={booking.service?.name} />
              {booking.studioRequirements && (
                <DetailRow
                  label="Studio Setup"
                  value={booking.studioRequirements}
                />
              )}
              {booking.equipmentRequired && (
                <DetailRow
                  label="Equipment"
                  value={booking.equipmentRequired}
                />
              )}
              {booking.additionalNotes && (
                <DetailRow label="Notes" value={booking.additionalNotes} />
              )}
            </dl>
          </SectionCard>

          {/* Customer Info */}
          <SectionCard title="Customer">
            <dl>
              <DetailRow
                label="Name"
                value={
                  booking.customerName ||
                  booking.customer?.user?.name ||
                  booking.createdBy?.name
                }
              />
              <DetailRow
                label="Email"
                value={
                  booking.customerEmail ||
                  booking.customer?.user?.email ||
                  booking.createdBy?.email
                }
              />
              <DetailRow
                label="Phone"
                value={booking.customerPhone || booking.customer?.user?.phone}
              />
              {booking.companyName && (
                <DetailRow label="Company" value={booking.companyName} />
              )}
              {booking.agent && (
                <DetailRow label="Agent" value={booking.agent.user?.name} />
              )}
            </dl>
          </SectionCard>

          {/* Pricing  only after quote is sent */}
          {booking.totalAmount != null && (
            <SectionCard title="Quote & Pricing">
              <dl>
                <DetailRow
                  label="Total Amount"
                  value={`₹${Number(booking.totalAmount).toLocaleString("en-IN")}`}
                />
                {booking.discountAmount > 0 && (
                  <DetailRow
                    label="Discount"
                    value={
                      <span className="text-green-600">
                        − ₹
                        {Number(booking.discountAmount).toLocaleString("en-IN")}
                      </span>
                    }
                  />
                )}
                {booking.discountAmount > 0 && booking.advanceAmount && (
                  <DetailRow
                    label="Net Payable"
                    value={`₹${Number(booking.advanceAmount).toLocaleString("en-IN")}`}
                  />
                )}
              </dl>
            </SectionCard>
          )}

          {/* Payments */}
          {booking.payments?.length > 0 && (
            <SectionCard title="Payments">
              <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#181818]">
                    <tr>
                      {["Type", "Mode", "Amount", "Status", "Date"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                    {booking.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-white text-sm">
                          {p.type}
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">
                          {p.mode}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-sm">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-black tracking-[0.1em] uppercase px-2 py-1 ${p.status === "PAID" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleDateString("en-IN")
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Invoices */}
          {booking.invoices?.length > 0 && (
            <SectionCard title="Invoices">
              <div className="space-y-0 border border-[#e5e5e5] dark:border-[#2a2a2a]">
                {booking.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a]">
                        ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-1.5 text-xs font-bold text-[#E5312A] hover:underline"
                      onClick={() =>
                        downloadInvoicePdf(inv.id, inv.invoiceNumber)
                      }
                    >
                      <FileText size={12} /> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Customer cancel */}
          {user?.role === "CUSTOMER" &&
            !["ADVANCE_PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(
              status,
            ) &&
            !confirmCancel && (
              <div className="flex justify-end">
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-sm text-[#E5312A] border border-[#E5312A]/30 px-4 py-2 hover:bg-[#E5312A]/5 transition-colors"
                >
                  Cancel Booking
                </button>
              </div>
            )}
        </div>

        {/* Right  admin actions */}
        {isAdmin && (
          <div className="space-y-3">
            {/* Send Quote */}
            {(status === "REQUEST" || status === "CHECKING") && (
              <SectionCard title="Send Quote">
                {showQuote ? (
                  <form
                    onSubmit={handleSubmit((d) =>
                      action(
                        () => api.patch(`/bookings/${id}/quote`, d),
                        "Quote sent to customer",
                      ).then((ok) => {
                        if (ok) setShowQuote(false);
                      }),
                    )}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                        Total Amount (₹)
                      </label>
                      <input
                        {...register("totalAmount")}
                        type="number"
                        className="input-field"
                        placeholder="50000"
                      />
                      {errors.totalAmount && (
                        <p className="text-[#E5312A] text-xs mt-1">
                          {errors.totalAmount.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                        Discount (₹)
                      </label>
                      <input
                        {...register("discountAmount")}
                        type="number"
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 bg-[#E5312A] hover:bg-[#CC2A24] text-white text-xs font-bold py-2.5 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? "Sending…" : "Send Quote"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQuote(false)}
                        className="flex-1 border border-[#e5e5e5] dark:border-[#2a2a2a] text-xs font-bold text-[#6b6b6b] dark:text-[#8a8a8a] py-2.5 hover:border-[#aaa] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowQuote(true)}
                    className="w-full bg-[#E5312A] hover:bg-[#CC2A24] text-white text-sm font-bold py-2.5 transition-colors"
                  >
                    Create Quote
                  </button>
                )}
              </SectionCard>
            )}

            {/* Approve */}
            {status === "QUOTED" && (
              <SectionCard title="Approve Booking">
                <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a] mb-3">
                  Customer will be notified and asked to pay the advance.
                </p>
                <button
                  onClick={() =>
                    action(
                      () => api.patch(`/bookings/${id}/approve`),
                      "Booking approved",
                    )
                  }
                  disabled={actionLoading}
                  className="w-full bg-[#E5312A] hover:bg-[#CC2A24] text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing…" : "Approve Booking"}
                </button>
              </SectionCard>
            )}

            {/* Assign Employee */}
            {["APPROVED", "ADVANCE_PAID", "IN_PROGRESS"].includes(status) && (
              <SectionCard title="Assign Crew">
                <select
                  value={assignEmp}
                  onChange={(e) => setAssignEmp(e.target.value)}
                  className="input-field mb-3 text-sm"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name ?? emp.id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!assignEmp)
                      return toast.error("Select an employee first");
                    action(
                      () =>
                        api.patch(`/bookings/${id}/assign-employee`, {
                          employeeId: assignEmp,
                        }),
                      "Employee assigned",
                    );
                  }}
                  disabled={actionLoading}
                  className="w-full bg-[#E5312A] hover:bg-[#CC2A24] text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50"
                >
                  {booking.employee ? "Reassign" : "Assign"}
                </button>
                {booking.employee && (
                  <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a] mt-2">
                    Currently assigned:{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {booking.employee.user?.name}
                    </strong>
                  </p>
                )}
              </SectionCard>
            )}

            {/* Start Shoot */}
            {status === "ADVANCE_PAID" && (
              <SectionCard title="Start Shoot">
                <button
                  onClick={() =>
                    action(
                      () => api.patch(`/bookings/${id}/start`),
                      "Shoot started",
                    )
                  }
                  disabled={actionLoading}
                  className="w-full bg-[#E5312A] hover:bg-[#CC2A24] text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing…" : "Mark In Progress"}
                </button>
              </SectionCard>
            )}

            {/* Complete */}
            {status === "IN_PROGRESS" && (
              <SectionCard title="Complete Booking">
                <button
                  onClick={() =>
                    action(
                      () => api.patch(`/bookings/${id}/complete`),
                      "Booking marked as completed",
                    )
                  }
                  disabled={actionLoading}
                  className="w-full bg-[#E5312A] hover:bg-[#CC2A24] text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing…" : "Mark Completed"}
                </button>
              </SectionCard>
            )}

            {/* Invoice */}
            {(status === "ADVANCE_PAID" || status === "COMPLETED") && (
              <SectionCard title="Invoice">
                <button
                  onClick={() =>
                    action(
                      () =>
                        api.post("/invoices/generate", {
                          bookingId: id,
                          type: "GST_INVOICE",
                        }),
                      "GST invoice generated",
                    )
                  }
                  disabled={actionLoading}
                  className="w-full border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-gray-900 dark:text-white py-2.5 hover:bg-[#f5f5f5] dark:hover:bg-[#181818] transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={14} /> Generate GST Invoice
                </button>
              </SectionCard>
            )}

            {/* Admin cancel */}
            {!["COMPLETED", "CANCELLED"].includes(status) && (
              <div className="border border-[#E5312A]/30 bg-white dark:bg-[#111111] p-4">
                <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#E5312A] mb-3">
                  Danger Zone
                </p>
                {confirmCancel ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a]">
                      This will cancel the booking and release the slot.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          action(
                            () => api.patch(`/bookings/${id}/cancel`),
                            "Booking cancelled",
                          ).then((ok) => {
                            if (ok) setConfirmCancel(false);
                          })
                        }
                        disabled={actionLoading}
                        className="flex-1 bg-[#E5312A] text-white text-xs font-bold py-2 hover:bg-[#CC2A24] transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? "…" : "Confirm Cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 border border-[#e5e5e5] dark:border-[#2a2a2a] text-xs font-bold text-[#6b6b6b] dark:text-[#8a8a8a] py-2"
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full border border-[#E5312A]/30 text-[#E5312A] text-sm font-bold py-2.5 hover:bg-[#E5312A]/5 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
