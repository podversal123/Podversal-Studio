'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

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
    <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">
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
  const advanceAmount   = totalAmount ? Math.round(totalAmount * 0.5) : null;

  useEffect(() => {
    setValue('endTime', '');
    setAvailability(null);
  }, [startTime, setValue]);

  useEffect(() => {
    if (!startTime || !endTime) { setAvailability(null); return; }
    const diff = toMin(endTime) - toMin(startTime);
    if (diff > 0) setValue('durationHours', diff / 60);
    if (!shootDate) return;

    setChecking(true);
    api.get<AvailabilityResult>('/bookings/availability', { params: { date: shootDate, startTime, endTime } })
      .then(r => setAvailability(r.data))
      .catch(() => setAvailability(null))
      .finally(() => setChecking(false));
  }, [startTime, endTime, shootDate, setValue]);

  const onSubmit = async (data: FormData) => {
    if (availability && !availability.available) {
      toast.error('This slot is already taken. Please choose a different time.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', data);
      toast.success('Slot confirmed — proceed to pay your advance.');
      router.push(`/dashboard/bookings/${res.data.id}`);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.message
        : null;
      toast.error(message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const endSlots = getEndSlots(startTime);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">New Booking</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Request a Studio Slot</h1>
        <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm mt-1">
          Fill in the details below. Our team will review and send you a quote.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Customer Details */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">Customer Details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel required>Full Name</FormLabel>
              <input {...register('customerName')} className="input-field" placeholder="Rahul Sharma" autoComplete="name" />
              {errors.customerName && <p className="text-[#E5312A] text-xs mt-1">{errors.customerName.message}</p>}
            </div>
            <div>
              <FormLabel required>Mobile Number</FormLabel>
              <input {...register('customerPhone')} className="input-field" placeholder="98765 43210" type="tel" />
              {errors.customerPhone && <p className="text-[#E5312A] text-xs mt-1">{errors.customerPhone.message}</p>}
            </div>
            <div>
              <FormLabel required>Email Address</FormLabel>
              <input {...register('customerEmail')} type="email" className="input-field" placeholder="rahul@example.com" autoComplete="email" />
              {errors.customerEmail && <p className="text-[#E5312A] text-xs mt-1">{errors.customerEmail.message}</p>}
            </div>
            <div>
              <FormLabel>Company / Brand Name</FormLabel>
              <input {...register('companyName')} className="input-field" placeholder="e.g. Sharma Productions (optional)" />
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-6 space-y-4">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-1">Booking Details</p>

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

          <p className="text-xs text-[#aaa] dark:text-[#555]">
            Studio hours: 6:00 AM to 2:00 AM. Minimum 2 hours per booking, in 2-hour increments.
          </p>
        </div>

        {/* Requirements */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] p-6 space-y-4">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-1">Requirements</p>
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
        {totalAmount && advanceAmount && (
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#181818] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <div>
              <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-1">Total Amount</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-1">Advance to Pay (50%)</p>
              <p className="text-xl font-black text-[#E5312A]">₹{advanceAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-1">Balance Due on Day</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">₹{(totalAmount - advanceAmount).toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || (availability !== null && !availability.available)}
            className="btn-primary !w-auto px-8"
          >
            {submitting ? 'Confirming…' : 'Confirm & Pay Advance'}
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
