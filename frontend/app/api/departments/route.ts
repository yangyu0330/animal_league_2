import { NextResponse } from 'next/server'
import { createDepartmentRecord, validateCreateDepartmentPayload } from './store'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = validateCreateDepartmentPayload(body)

    if (!payload) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'schoolId, name, category 값을 확인해주세요.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(createDepartmentRecord(payload))
  } catch (error) {
    console.error('[POST /api/departments]', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
