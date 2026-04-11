import { NextResponse } from 'next/server'
import { clickDepartmentRecord, validateClickDepartmentPayload } from '../../store'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body = await req.json()
    const payload = validateClickDepartmentPayload(body)
    const { id } = await context.params

    if (!payload) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          error: 'VALIDATION_ERROR',
          message: 'Invalid request. Check deviceHash and refSource.',
        },
        { status: 400 },
      )
    }

    const response = clickDepartmentRecord(id, payload)
    if (!response) {
      return NextResponse.json(
        {
          code: 'NOT_FOUND',
          error: 'NOT_FOUND',
          message: 'Department not found.',
        },
        { status: 404 },
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/departments/:id/click]', error)

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
