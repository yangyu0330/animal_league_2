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
          message: 'deviceHash와 refSource 값을 확인해주세요.',
        },
        { status: 400 },
      )
    }

    const response = clickDepartmentRecord(id, payload)
    if (!response) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 },
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/departments/:id/click]', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
