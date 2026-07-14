import { NextResponse } from "next/server";
import {
  getCurrentRolePermissions,
  getCurrentSecurityContext,
} from "@/lib/security/permissionEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [context, permissions] = await Promise.all([
      getCurrentSecurityContext(),
      getCurrentRolePermissions(),
    ]);

    return NextResponse.json({
      data: {
        context,
        permissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Impossible de charger les capacités du compte.",
      },
      { status: 500 }
    );
  }
}
