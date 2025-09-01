export interface Identity {
  id: string;
  phone: string;
  name: string | null;
  countryCode: string | null;
  nationalCode: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}
