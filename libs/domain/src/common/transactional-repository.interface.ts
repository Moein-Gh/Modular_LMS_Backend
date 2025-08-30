export interface TransactionalRepository {
  withTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
