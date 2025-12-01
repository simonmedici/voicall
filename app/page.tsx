import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Industries } from "@/components/landing/industries";
import { Features } from "@/components/landing/features";
import { Compliance } from "@/components/landing/compliance";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Industries />
      <Features />
      <Compliance />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
