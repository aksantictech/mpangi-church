import { NextResponse } from "next/server";
import {
  getCurrentChurchRoleValidation,
} from "@/lib/security/roleValidation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data =
      await getCurrentChurchRoleValidation();

    return NextResponse.json({
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Impossible de valider la matrice des rôles.",
      },
      {
        status: 500,
      }
    );
  }
}
