// Messaging domain DI tokens and basic types
// This file stays framework-agnostic and serves as a stable anchor for DI.

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
export const MESSAGE_TEMPLATE_REPOSITORY = Symbol(
  'MESSAGE_TEMPLATE_REPOSITORY',
);
export const RECIPIENT_GROUP_REPOSITORY = Symbol('RECIPIENT_GROUP_REPOSITORY');

export type MessageId = string;
export type MessageTemplateId = string;
export type RecipientGroupId = string;
