// User domain DI tokens and basic types
// This file stays framework-agnostic and serves as a stable anchor for DI.

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserId = string;
