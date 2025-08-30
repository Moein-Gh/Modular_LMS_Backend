import { DomainUser } from '@app/domain';

export type UpdateUserInput = Omit<DomainUser, 'id' | 'identity'>;
