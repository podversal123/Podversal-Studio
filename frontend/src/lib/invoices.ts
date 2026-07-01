import toast from 'react-hot-toast';
import api from './api';

// Uses the shared `api` axios instance (auth header + refresh-token retry)
// instead of raw fetch, and shows an error instead of silently downloading
// an unreadable PDF when the request fails (e.g. expired session).
export async function downloadInvoicePdf(invoiceId: string, invoiceNumber: string) {
  try {
    const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Failed to download invoice PDF. Please try again.');
  }
}
