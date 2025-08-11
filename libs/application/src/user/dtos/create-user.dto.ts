export interface CreateUserCommand {
  email: string;
}

export interface CreateUserResult {
  id: string;
  email: string;
  isActive: boolean;
}
