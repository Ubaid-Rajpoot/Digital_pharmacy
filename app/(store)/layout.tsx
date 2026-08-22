// Storefront chrome shared by every shop page: header, footer, cart drawer,
// modals and toasts all live here so /checkout, /product/[slug] and /track
// share the same cart + overlay state via StoreProvider.

import { StoreProvider } from "@/components/StoreProvider";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import QuickViewModal from "@/components/QuickViewModal";
import RxModal from "@/components/RxModal";
import ChatWidget from "@/components/ChatWidget";
import BackToTop from "@/components/BackToTop";
import Toasts from "@/components/Toasts";
import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <Loader />
      <div className="noise" aria-hidden="true" />
      <Header />

      <main>{children}</main>

      <Footer />

      <CartDrawer />
      <QuickViewModal />
      <RxModal />
      <ChatWidget />
      <BackToTop />
      <Toasts />
    </StoreProvider>
  );
}
