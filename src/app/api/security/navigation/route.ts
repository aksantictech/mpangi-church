import { NextResponse } from "next/server";
import {
  getAllowedNavigationItems,
  groupPermissionNavigation,
} from "@/lib/security/permissionNavigation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result =
      await getAllowedNavigationItems();

    return NextResponse.json({
      data: {
        context: result.context,
        items: result.items,
        groups: groupPermissionNavigation(
          result.items
        ),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Impossible de charger la navigation autorisée.",
      },
      { status: 500 }
    );
  }
}
