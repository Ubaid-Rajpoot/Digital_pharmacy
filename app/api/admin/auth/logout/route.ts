import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { destroySession, getSessionUser } from "@/lib/auth";
import { write } from "@/lib/db/store";

export async function POST(_request: NextRequest) {
  try {
    const user = await getSessionUser();
    await destroySession();
    if (user) {
      await write((db) => {
        db.audit.unshift({
          id: ++db.seq,
          user: user.name,
          action: "signed out",
          target: "Admin panel",
          at: new Date().toISOString(),
          ip: "127.0.0.1",
          changes: [],
        });
      });
    }
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
