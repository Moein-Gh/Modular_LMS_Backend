export type CreateUserInput = {
  identityId: string;
};

export interface CreateUserResult {
  id: string;
  identityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
