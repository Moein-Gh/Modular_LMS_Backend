import { User } from '@app/domain';

export type UpdateUserInput = Omit<User, 'id' | 'identity'>;
