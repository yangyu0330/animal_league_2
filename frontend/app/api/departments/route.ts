import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    return NextResponse.json({
      message: "B-2 departments route connected",
      body,
    })
  } catch (error) {
    console.error("[POST /api/departments]", error)

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}