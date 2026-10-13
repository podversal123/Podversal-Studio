import { redirect } from "next/navigation";

// /founder (without the "s") is an easy URL to mistype or print on a QR code.
// Send it to /founders and keep any query string, e.g. ?ref=ritu.
export default function FounderRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value !== undefined) qs.set(key, value);
  }
  const query = qs.toString();
  redirect(query ? `/founders?${query}` : "/founders");
}
