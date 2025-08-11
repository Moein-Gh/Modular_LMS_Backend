import { CreateUserUseCase } from './create-user.usecase';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error';
import type { IUserRepository, DomainUser } from '@app/domain';

describe('CreateUserUseCase', () => {
  const makeRepo = (overrides?: Partial<IUserRepository>): IUserRepository => {
    const base: IUserRepository = {
      createUser(params: { email: string }): Promise<DomainUser> {
        return Promise.resolve({
          id: 'u_1',
          email: params.email,
          isActive: false,
        });
      },
      findByEmail(): Promise<DomainUser | null> {
        return Promise.resolve(null);
      },
      findById(): Promise<DomainUser | null> {
        return Promise.resolve(null);
      },
      setActive(): Promise<void> {
        return Promise.resolve();
      },
    };
    return { ...base, ...(overrides ?? {}) };
  };

  it('creates a new user when email is not taken', async () => {
    const repo = makeRepo();
    const usecase = new CreateUserUseCase(repo);
    const result = await usecase.execute({ email: 'ok@example.com' });
    expect(result).toEqual({
      id: 'u_1',
      email: 'ok@example.com',
      isActive: false,
    });
  });

  it('throws UserAlreadyExistsError when email is taken', async () => {
    const repo = makeRepo({
      findByEmail(email: string) {
        return Promise.resolve({ id: 'u_x', email, isActive: true });
      },
    });
    const usecase = new CreateUserUseCase(repo);
    await expect(
      usecase.execute({ email: 'dup@example.com' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });
});
