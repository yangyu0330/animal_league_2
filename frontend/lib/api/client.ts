export class ApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if ('error' in payload && typeof payload.error === 'string') return payload.error
  }
  return fallback
}

function getErrorCode(payload: unknown, fallback = 'INTERNAL_ERROR'): string {
  if (payload && typeof payload === 'object') {
    if ('code' in payload && typeof payload.code === 'string') return payload.code
    if ('errorCode' in payload && typeof payload.errorCode === 'string') return payload.errorCode
  }
  return fallback
}

export function useMockApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false'
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorCode(payload),
      getErrorMessage(payload, '요청 처리에 실패했습니다.'),
      response.status,
    )
  }

  return payload as T
}
