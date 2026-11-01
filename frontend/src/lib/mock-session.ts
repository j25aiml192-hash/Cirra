export const MOCK_TENANT_ID = "c536ffbb-87ab-46e8-82c2-881637dea334"
export const MOCK_USER_ID = "751cbc5f-f8c8-46ff-8c81-b8c1582bb895"
export const MOCK_USER_ROLE = "owner"
export const MOCK_USER_EMAIL = "h90519495@gmail.com"

export const mockUser = {
  id: MOCK_USER_ID,
  email: MOCK_USER_EMAIL,
  app_metadata: {
    tenant_id: MOCK_TENANT_ID,
    role: MOCK_USER_ROLE,
  },
  user_metadata: {
    tenant_id: MOCK_TENANT_ID,
    role: MOCK_USER_ROLE,
  },
}

