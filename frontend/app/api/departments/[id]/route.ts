import { NextResponse } from 'next/server'
import { getDepartmentRecordById } from '../store'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const department = getDepartmentRecordById(id)

    if (!department) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 },
      )
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('[GET /api/departments/:id]', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
