export interface AuthPermission {
  _id: string;
  role: string;
  scopeType: string;
  scopeId: string | null;
  expiresAt?: string | null;
}

export interface User {
  _id: string;
  id?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  orgType?: string | null;
  orgId?: string | null;
  status?: string | null;
  error?: string | null;
}

export interface AuthState {
  user: User;
  orgType: string | null;
  roles: string[];
  permissions: AuthPermission[];
}

export interface AuthContextType {
  user: User | null;
  auth: AuthState | null;
  orgType: string | null;
  roles: string[];
  permissions: AuthPermission[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  hasRole: (role: string) => boolean;
  hasPermission: (
    role: string,
    scopeType?: string,
    scopeId?: string | null,
  ) => boolean;
}
