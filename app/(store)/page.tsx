// Medora landing page — every part of the page is its own component so each
// section can be swapped, styled or extended independently later.

import Hero from "@/components/Hero";
import CategoriesSection from "@/components/CategoriesSection";
import ProductsSection from "@/components/ProductsSection";
import WhySection from "@/components/WhySection";
import ConsultSection from "@/components/ConsultSection";
import ReviewsSection from "@/components/ReviewsSection";
import WellnessSection from "@/components/WellnessSection";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <ProductsSection />
      <WhySection />
      <ConsultSection />
      <ReviewsSection />
      <WellnessSection />
    </>
  );
}
