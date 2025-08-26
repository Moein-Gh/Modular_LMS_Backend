// AuthUser: minimal user identity for auth context
export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
  countryCode?: string;
  nationalCode?: string;
  email?: string;
}
