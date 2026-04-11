import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      todayCount: 0,
      items: [],
    })
  } catch (error) {
    console.error("[GET /api/me/activity]", error)

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}