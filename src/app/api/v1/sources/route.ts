import { NextResponse } from "next/server";
import { getPersistenceRepository } from "@/server/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "MISSING_PARAMETER", message: "Query parameter 'id' is required" },
        { status: 400 }
      );
    }

    const repo = getPersistenceRepository();
    const sourceWithSentences = await repo.getSource(id);

    if (!sourceWithSentences) {
      return NextResponse.json(
        { error: "SOURCE_NOT_FOUND", message: `Source with id ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sourceWithSentences,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve source" },
      { status: 500 }
    );
  }
}
