import CurtainHero from "@/components/founders/CurtainHero";
import BookingSection from "@/components/founders/BookingSection";

export default function FoundersPage() {
  return (
    <main className="min-h-screen bg-[#faf5dc]">
      <CurtainHero />
      <BookingSection />
      <footer className="bg-[#faf5dc] px-5 pb-10 text-center text-[14px] text-[#89171a]/70">
        Podversal Studio, Greater Noida West
      </footer>
    </main>
  );
}
