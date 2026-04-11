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
        {
          code: 'NOT_FOUND',
          error: 'NOT_FOUND',
          message: 'Department not found.',
        },
        { status: 404 },
      )
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('[GET /api/departments/:id]', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        error: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred.',
      },
      { status: 500 },
    )
  }
}
