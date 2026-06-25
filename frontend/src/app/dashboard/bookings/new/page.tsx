'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, IndianRupee } from 'lucide-react';
import api from '@/lib/api';

const loadRazorpay = (): Promise<boolean> =>
  new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

interface Service {
  id: string; name: string; type: string; pricePerHour: number; minDuration: number;
}

interface AvailabilityResult {
  available: boolean;
  lockedBy: string | null;
  hasConfirmedBooking: boolean;
}

const START_SLOTS = [
  { value: '06:00', label: '6:00 AM'  },
  { value: '08:00', label: '8:00 AM'  },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM'  },
  { value: '16:00', label: '4:00 PM'  },
  { value: '18:00', label: '6:00 PM'  },
  { value: '20:00', label: '8:00 PM'  },
  { value: '22:00', label: '10:00 PM' },
  { value: '24:00', label: '12:00 AM (Midnight)' },
];

const ALL_END_SLOTS = [
  { value: '08:00', label: '8:00 AM'  },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM'  },
  { value: '16:00', label: '4:00 PM'  },
  { value: '18:00', label: '6:00 PM'  },
  { value: '20:00', label: '8:00 PM'  },
  { value: '22:00', label: '10:00 PM' },
  { value: '24:00', label: '12:00 AM (Midnight)' },
  { value: '26:00', label: '2:00 AM'  },
];

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const getEndSlots = (start: string) =>
  !start ? [] : ALL_END_SLOTS.filter(s => toMin(s.value) > toMin(start));

const schema = z.object({
  customerName:       z.string().min(2, 'Full name must be at least 2 characters'),
  customerEmail:      z.string().email('Enter a valid email address'),
  customerPhone:      z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  companyName:        z.string().optional(),
  serviceId:          z.string().min(1, 'Select a service'),
  shootDate:          z.string().min(1, 'Select a date'),
  startTime:          z.string().min(1, 'Select a start time'),
  endTime:            z.string().min(1, 'Select an end time'),
  durationHours:      z.coerce.number().min(2, 'Minimum booking is 2 hours'),
  studioRequirements: z.string().optional(),
  equipmentRequired:  z.string().optional(),
  additionalNotes:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
      {children}{required && <span className="text-[#E5312A] ml-1">*</span>}
    </label>
  );
}

export default function NewBookingPage() {
  const router = useRouter();
  const [services,     setServices]     = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checking,     setChecking]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get<Service[]>('/services').then(r => setServices(r.data)).catch(() => {});
  }, []);

  const startTime   = watch('startTime');
  const endTime     = watch('endTime');
  const shootDate   = watch('shootDate');
  const serviceId   = watch('serviceId');
  const duration    = watch('durationHours');

  const selectedService = services.find(s => s.id === serviceId);
  const totalAmount     = selectedService && duration ? Math.round(duration * selectedService.pricePerHour) : null;

  useEffect(() => {
    setValue('endTime', '');
    setAvailability(null);
  }, [startTime, setValue]);

  // Refs so SSE handler always sees latest values without stale closure
  const startTimeRef = useRef(startTime);
  const endTimeRef   = useRef(endTime);
  const shootDateRef = useRef(shootDate);
  startTimeRef.current = startTime;
  endTimeRef.current   = endTime;
  shootDateRef.current = shootDate;

  const checkAvailability = (st: string, et: string, sd: string) => {
    setChecking(true);
    api.get<AvailabilityResult>('/bookings/availability', { params: { date: sd, startTime: st, endTime: et } })
      .then(r => setAvailability(r.data))
      .catch(() => setAvailability(null))
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    if (!startTime || !endTime) { setAvailability(null); return; }
    const diff = toMin(endTime) - toMin(startTime);
    if (diff > 0) setValue('durationHours', diff / 60);
    if (!shootDate) return;
    checkAvailability(startTime, endTime, shootDate);
  }, [startTime, endTime, shootDate, setValue]);

  // Re-check in real time when another booking is created/cancelled
  useEffect(() => {
    const handler = () => {
      const st = startTimeRef.current;
      const et = endTimeRef.current;
      const sd = shootDateRef.current;
      if (st && et && sd) checkAvailability(st, et, sd);
    };
    window.addEventListener('podversal:live', handler);
    return () => window.removeEventListener('podversal:live', handler);
  }, []);

  const onSubmit = async (data: FormData) => {
    if (availability && !availability.available) {
      toast.error('This slot is already taken. Please choose a different time.');
      return;
    }
    setSubmitting(true);
    let bookingId: string | null = null;
    try {
      // Step 1: Create booking in DB (status = APPROVED, slot reserved)
      const bookingRes = await api.post('/bookings', data);
      bookingId = bookingRes.data.id;
      const bookingCode = bookingRes.data.bookingCode;
      const amount      = bookingRes.data.advanceAmount ?? bookingRes.data.totalAmount;

      // Step 2: Load Razorpay script dynamically
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error('Payment gateway unavailable. Please try again.');
        api.patch(`/bookings/${bookingId}/cancel`).catch(() => {});
        setSubmitting(false);
        return;
      }

      // Step 3: Create Razorpay order
      const orderRes = await api.post('/payments/razorpay/order', {
        bookingId, amount, type: 'ADVANCE',
      });
      const { orderId, currency, paymentId, keyId } = orderRes.data;

      // Step 4: Open Razorpay modal
      let slotReleased = false;
      const releaseSlot = () => {
        if (!slotReleased && bookingId) {
          slotReleased = true;
          api.patch(`/bookings/${bookingId}/cancel`).catch(() => {});
        }
      };

      const rzp = new (window as any).Razorpay({
        key:         keyId,
        amount:      Math.round(Number(amount) * 100),
        currency,
        name:        'Podversal Studio',
        description: `Slot Confirmation — ${bookingCode}`,
        order_id:    orderId,
        theme:       { color: '#E5312A' },
        prefill:     { name: data.customerName, email: data.customerEmail, contact: data.customerPhone },
        handler: async (resp: any) => {
          try {
            await api.post('/payments/razorpay/verify', {
              razorpayOrderId:   resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              bookingId,
              paymentDbId: paymentId,
            });
            toast.success('Payment successful — your studio slot is confirmed!');
            router.push(`/dashboard/bookings/${bookingId}`);
          } catch {
            toast.error(`Payment received but verification failed. Share this ID with us: ${resp.razorpay_payment_id}`);
            router.push(`/dashboard/bookings/${bookingId}`);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled. Slot has been released.');
            releaseSlot();
            setSubmitting(false);
          },
        },
      });
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        releaseSlot();
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Something went wrong. Please try again.';
      toast.error(message);
      if (bookingId) api.patch(`/bookings/${bookingId}/cancel`).catch(() => {});
      setSubmitting(false);
    }
  };

  const endSlots = getEndSlots(startTime);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">New Booking</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Book a Studio Slot</h1>
        <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm mt-1">
          Select your date, time, and service. Pay online to instantly confirm your slot.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Customer Details */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888]">Customer Details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel required>Full Name</FormLabel>
              <input {...register('customerName')} className="input-field" placeholder="Full Name" autoComplete="name" />
              {errors.customerName && <p className="text-[#E5312A] text-xs mt-1">{errors.customerName.message}</p>}
            </div>
            <div>
              <FormLabel required>Mobile Number</FormLabel>
              <input {...register('customerPhone')} className="input-field" placeholder="Mobile Number" type="tel" autoComplete="tel" />
              {errors.customerPhone && <p className="text-[#E5312A] text-xs mt-1">{errors.customerPhone.message}</p>}
            </div>
            <div>
              <FormLabel required>Email Address</FormLabel>
              <input {...register('customerEmail')} type="email" className="input-field" placeholder="Email Address" autoComplete="email" />
              {errors.customerEmail && <p className="text-[#E5312A] text-xs mt-1">{errors.customerEmail.message}</p>}
            </div>
            <div>
              <FormLabel>Company / Brand Name</FormLabel>
              <input {...register('companyName')} className="input-field" placeholder="Company / Brand Name (optional)" autoComplete="organization" />
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-6 space-y-4">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-1">Booking Details</p>

          <div>
            <FormLabel required>Service</FormLabel>
            <select {...register('serviceId')} className="input-field">
              <option value="">Select a studio service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{Number(s.pricePerHour).toLocaleString('en-IN')}/hr · min {s.minDuration}h
                </option>
              ))}
            </select>
            {errors.serviceId && <p className="text-[#E5312A] text-xs mt-1">{errors.serviceId.message}</p>}
          </div>

          <div>
            <FormLabel required>Shoot Date</FormLabel>
            <input
              {...register('shootDate')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
            {errors.shootDate && <p className="text-[#E5312A] text-xs mt-1">{errors.shootDate.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel required>Start Time</FormLabel>
              <select {...register('startTime')} className="input-field">
                <option value="">Select start time</option>
                {START_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.startTime && <p className="text-[#E5312A] text-xs mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <FormLabel required>End Time</FormLabel>
              <select {...register('endTime')} className="input-field" disabled={!startTime}>
                <option value="">{startTime ? 'Select end time' : 'Select start time first'}</option>
                {endSlots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.endTime && <p className="text-[#E5312A] text-xs mt-1">{errors.endTime.message}</p>}
            </div>
          </div>

          {/* Duration + availability */}
          {startTime && endTime && (
            <div className="flex flex-wrap items-center gap-5 border border-[#e5e5e5] dark:border-[#2a2a2a] px-4 py-3 bg-[#f5f5f5] dark:bg-[#181818]">
              <span className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
                Duration: <strong className="text-gray-900 dark:text-white">{(toMin(endTime) - toMin(startTime)) / 60} hrs</strong>
              </span>
              {checking ? (
                <span className="flex items-center gap-1.5 text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
                  <Loader2 size={13} className="animate-spin" /> Checking availability…
                </span>
              ) : availability ? (
                <span className={`flex items-center gap-1.5 text-sm font-bold ${availability.available ? 'text-green-600' : 'text-[#E5312A]'}`}>
                  {availability.available
                    ? <><CheckCircle size={13} /> Slot is available</>
                    : <><XCircle size={13} /> Slot already booked</>
                  }
                </span>
              ) : null}
            </div>
          )}

          <p className="text-xs text-[#888] dark:text-[#666]">
            Studio hours: 6:00 AM to 2:00 AM. Minimum 2 hours per booking, in 2-hour increments.
          </p>
        </div>

        {/* Requirements */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-6 space-y-4">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-1">Requirements</p>
          <div>
            <FormLabel>Studio Setup</FormLabel>
            <textarea
              {...register('studioRequirements')}
              rows={2}
              className="input-field resize-none"
              placeholder="e.g. Green screen, extra lighting rigs, two-host setup with separate mics"
            />
          </div>
          <div>
            <FormLabel>Equipment Needed</FormLabel>
            <textarea
              {...register('equipmentRequired')}
              rows={2}
              className="input-field resize-none"
              placeholder="e.g. Teleprompter, DJI mic, DSLR for b-roll, boom stand"
            />
          </div>
          <div>
            <FormLabel>Anything Else</FormLabel>
            <textarea
              {...register('additionalNotes')}
              rows={2}
              className="input-field resize-none"
              placeholder="e.g. First time at the studio, team of 4 people, need parking for a van"
            />
          </div>
        </div>

        {/* Price summary — shown when service + time are selected */}
        {totalAmount && (
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#181818] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <div>
              <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-1">Total Payable</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <p className="text-xs text-[#888] dark:text-[#666]">Pay this amount to lock your slot.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || (availability !== null && !availability.available)}
            className="btn-primary !w-auto px-8 flex items-center gap-2"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
              : totalAmount
                ? <><IndianRupee size={14} /> Book & Pay ₹{totalAmount.toLocaleString('en-IN')}</>
                : 'Book & Pay'
            }
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] dark:hover:border-[#555] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
