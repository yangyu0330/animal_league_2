import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    return NextResponse.json({
      message: "B-2 click route connected",
      departmentId: params.id,
      body,
    })
  } catch (error) {
    console.error("[POST /api/departments/:id/click]", error)

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}