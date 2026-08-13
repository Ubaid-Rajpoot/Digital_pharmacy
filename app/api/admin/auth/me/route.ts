import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { getSessionUser, grantedModules } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return ok({ signedIn: false });
    const modules = await grantedModules(user);
    return ok({
      signedIn: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      modules,
    });
  } catch (e) {
    return handleError(e);
  }
}
