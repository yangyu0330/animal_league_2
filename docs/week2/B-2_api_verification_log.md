# B-2 API Verification Log

## Scope
- POST `/api/departments`
- POST `/api/departments/:id/click`
- GET `/api/me/activity`

## Minimal 6 Scenarios (Executed)
Execution date: 2026-04-12 (Asia/Seoul)

1. Create success
- Request: valid `schoolId`, unique `name`, valid `category`
- Result: `created=true`, `departmentId` returned
- Status: PASS

2. Create duplicate
- Request: same payload as scenario 1
- Result: `created=false`, `reason=DUPLICATE`, `existingDepartmentId` returned
- Status: PASS

3. Click success
- Request: single click on created department
- Result: `accepted=true`, `newTotalClicks` increased, `reason=OK`
- Status: PASS

4. Click limit
- Request: repeated clicks in a short time window (10 seconds)
- Result: denied clicks returned `accepted=false`, `reason=BURST_OVER_60`
- Status: PASS

5. Click on non-existent department
- Request: POST `/api/departments/dep_not_exists/click`
- Result: `404` with `{ code: "NOT_FOUND", error: "NOT_FOUND", message }`
- Status: PASS

6. Activity query
- Request: GET `/api/me/activity?limit=20`
- Result: `todayCount` and `items[]` returned, latest events visible
- Status: PASS

## Manual Curl Samples
Use these against local dev server (`http://localhost:3000`).

### 0) Get a valid category value first
```bash
curl "http://localhost:3000/api/departments/search?q=&limit=1"
```
Use `items[0].category` as `<valid-category>` below.

### 1) Create department
```bash
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId":"school_001",
    "name":"test-dept-001",
    "category":"<valid-category>",
    "templateId":"eng_default_01"
  }'
```

### 2) Create duplicate
```bash
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId":"school_001",
    "name":"test-dept-001",
    "category":"<valid-category>",
    "templateId":"eng_default_01"
  }'
```

### 3) Click department
```bash
curl -X POST http://localhost:3000/api/departments/<departmentId>/click \
  -H "Content-Type: application/json" \
  -d '{
    "deviceHash":"sha256_test_device_01",
    "refSource":"direct"
  }'
```

### 4) Click non-existent department
```bash
curl -X POST http://localhost:3000/api/departments/dep_not_exists/click \
  -H "Content-Type: application/json" \
  -d '{
    "deviceHash":"sha256_test_device_01",
    "refSource":"direct"
  }'
```

### 5) Activity list
```bash
curl "http://localhost:3000/api/me/activity?limit=20"
```

## Notes
- Current click policy covers Rule A/B.
- Rule C/D implementation is scheduled in Wednesday step.
