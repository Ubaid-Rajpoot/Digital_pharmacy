// Medora landing page — every part of the page is its own component so each
// section can be swapped, styled or extended independently later.

import { StoreProvider } from "@/components/StoreProvider";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
// import StatsBand from "@/components/StatsBand"; // stats cards commented out
// import Marquee from "@/components/Marquee"; // certificate marquee commented out
// import CareSection from "@/components/CareSection"; // care section commented out — "Why families stay with us"
import CategoriesSection from "@/components/CategoriesSection";
import ProductsSection from "@/components/ProductsSection";
import WhySection from "@/components/WhySection";
import ConsultSection from "@/components/ConsultSection";
import ReviewsSection from "@/components/ReviewsSection";
// import AppSection from "@/components/AppSection"; // app section commented out — we don't have an app yet
import WellnessSection from "@/components/WellnessSection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import QuickViewModal from "@/components/QuickViewModal";
import RxModal from "@/components/RxModal";
import ChatWidget from "@/components/ChatWidget";
import BackToTop from "@/components/BackToTop";
import Toasts from "@/components/Toasts";

export default function Home() {
  return (
    <StoreProvider>
      {/* chrome / overlays */}
      <Loader />
      <div className="noise" aria-hidden="true" />
      <Header />

      {/* page sections */}
      <main>
        <Hero />
        {/* <StatsBand /> */}
        {/* <Marquee /> */}
        {/* <CareSection /> */}
        <CategoriesSection />
        <ProductsSection />
        <WhySection />
        <ConsultSection />
        <ReviewsSection />
        {/* <AppSection /> */}
        <WellnessSection />
      </main>

      <Footer />

      {/* drawers / modals / widgets */}
      <CartDrawer />
      <QuickViewModal />
      <RxModal />
      <ChatWidget />
      <BackToTop />
      <Toasts />
    </StoreProvider>
  );
}
