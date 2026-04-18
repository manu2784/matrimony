Request hits API
│
▼
authenticate → valid JWT in HttpOnly cookie? token revoked?
│
▼
requireTenantAccess → provider: is tenant in managedTenants[]?
tenant user: does orgId match?
│
▼
requirePermission → does role have this permission string?
│
▼
requireResourceAccess → sub_admin: is resourceId in resources[]?
tenant_admin+: pass through
│
▼
Service layer → final ownership/data-level check before DB query
│
▼
Response
