Cloud Provider Org (your company)
├── Super Admin          ← god mode, cross-tenant
└── Account Manager      ← manages assigned tenants only

Customer Org (Tenant)
├── Tenant Admin         ← owns everything in their org
├── Sub Admin            ← owns assigned resources in org
└── Member               ← basic access