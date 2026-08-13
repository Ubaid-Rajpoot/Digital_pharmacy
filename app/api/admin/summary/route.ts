import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { read } from "@/lib/db/store";

export async function GET(_request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return ok({ signedIn: false });
    return read((db) => {
      const pendingOrders = db.orders.filter((o) => o.status === "pending").length;
      const lowStock = db.products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAlert && !p.deletedAt).length;
      const dealerPending = db.dealers.filter((d) => d.status === "pending").length;
      const refundRequests = db.orders.filter((o) => o.status === "returned" || (o.refund && o.status !== "refunded")).length;
      const reviewsPending = db.reviews.filter((r) => r.status === "pending").length;
      const supportOpen = db.support.filter((s) => ["new", "open", "pending"].includes(s.status)).length;
      const unread = db.notifications.filter((n) => !n.read).length;
      const recent = db.notifications
        .slice()
        .sort((a, b) => +new Date(b.at) - +new Date(a.at))
        .slice(0, 8);
      return ok({
        signedIn: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        counts: { pendingOrders, lowStock, dealerPending, refundRequests, reviewsPending, supportOpen, unread },
        notifications: recent.map((n, i) => ({
          id: n.id ?? `legacy-${i}`, type: n.type, title: n.title, body: n.body, at: n.at, read: n.read, href: n.href,
        })),
      });
    });
  } catch (e) {
    return handleError(e);
  }
}
