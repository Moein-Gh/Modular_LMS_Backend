# Messaging Module Setup

## Overview

The messaging module provides functionality for sending SMS, email, and push notifications to users. It includes:

- **DTOs**: Request/response validation classes
- **Services**: Business logic for messaging, templates, and recipient groups
- **Controllers**: REST API endpoints for admin operations
- **Queue System**: BullMQ processor for async message sending (optional)

## Files Created

### DTOs (`libs/application/src/messaging/dto/`)

- `send-message.dto.ts` - Request DTO for sending messages
- `update-message.dto.ts` - Request DTO for updating messages
- `update-recipient-status.dto.ts` - Request DTO for updating recipient status
- `message-response.dto.ts` - Response DTOs for messages and recipients
- `message-query.dto.ts` - Query DTO with filters for listing messages
- `index.ts` - Barrel export for all DTOs

### Controllers (`apps/api-admin/src/messaging/`)

- `messaging.controller.ts` - CRUD operations for messages
- `message-template.controller.ts` - CRUD operations for message templates
- `recipient-group.controller.ts` - CRUD operations for recipient groups

### Queue System (`libs/application/src/messaging/queues/`)

- `messaging.queue.ts` - Queue definitions and job types
- `messaging.processor.ts` - BullMQ processor (requires BullMQ to be installed)
- `index.ts` - Barrel export

## Current Status

✅ All files created and integrated
✅ Controllers registered in `api-admin.module.ts`
✅ Services exported from `MessagingApplicationModule`
✅ DTOs validated with class-validator
✅ TypeScript errors resolved

## API Endpoints Available

### Messages

- `POST /messages` - Send a new message
- `GET /messages` - List all messages with pagination and filters
- `GET /messages/:id` - Get message by ID
- `PATCH /messages/:id` - Update message
- `PATCH /messages/recipients/:recipientId/status` - Update recipient status
- `DELETE /messages/:id` - Soft delete message
- `POST /messages/:id/restore` - Restore deleted message

### Message Templates

- `POST /message-templates` - Create template
- `GET /message-templates` - List templates
- `GET /message-templates/:id` - Get template
- `PATCH /message-templates/:id` - Update template
- `DELETE /message-templates/:id` - Soft delete template
- `POST /message-templates/:id/restore` - Restore template

### Recipient Groups

- `POST /recipient-groups` - Create group
- `GET /recipient-groups` - List groups
- `GET /recipient-groups/:id` - Get group
- `PATCH /recipient-groups/:id` - Update group
- `DELETE /recipient-groups/:id` - Soft delete group
- `POST /recipient-groups/:id/restore` - Restore group

## Optional: Enable BullMQ for Async Processing

The queue processor is ready but commented out. To enable async message sending:

### 1. Install Dependencies

```bash
pnpm add @nestjs/bullmq bullmq ioredis
pnpm add -D @types/ioredis
```

### 2. Add Redis Configuration

Add to your `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Update Configuration

Add Redis config to `libs/config/src/`:

```typescript
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};
```

### 4. Register BullMQ Module

In `libs/application/src/messaging/messaging-application.module.ts`:

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MessagingInfraModule,
    UserInfraModule,
    BullModule.registerQueue({
      name: 'messaging',
    }),
    BullModule.registerQueue({
      name: 'scheduled-messages',
    }),
  ],
  // ... rest of config
})
```

### 5. Uncomment Decorators

In `libs/application/src/messaging/queues/messaging.processor.ts`, uncomment:

- `@Processor('messaging')` on the class
- `@Process('send-sms')` on `handleSendSms`
- `@Process('send-email')` on `handleSendEmail`
- `@Process('send-push')` on `handleSendPush`
- `@Process('process-scheduled')` on `handleScheduledMessages`

### 6. Inject Queue in Service

Update `MessagingService` to inject and use the queue:

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

constructor(
  // ... existing dependencies
  @InjectQueue('messaging') private messagingQueue: Queue,
) {}
```

### 7. Queue Jobs Instead of Sync Processing

Update the `sendMessage` method to queue jobs for each recipient instead of creating them synchronously.

## Permissions Required

The following permissions should be created in your database:

- `message/send`
- `message/get`
- `message/update`
- `message/delete`
- `message/restore`
- `message-template/create`
- `message-template/get`
- `message-template/update`
- `message-template/delete`
- `message-template/restore`
- `recipient-group/create`
- `recipient-group/get`
- `recipient-group/update`
- `recipient-group/delete`
- `recipient-group/restore`

## Next Steps

1. **Add Permissions**: Create the permissions listed above in your seed data
2. **Test Endpoints**: Use the Swagger UI to test the messaging endpoints
3. **Integrate Providers**: Add real SMS/Email/Push notification providers in the processor
4. **Enable BullMQ**: Follow the steps above if you need async processing
5. **Add Cron Job**: Set up a cron job to process scheduled messages periodically
6. **Add Tests**: Write unit and integration tests for the messaging module

## Provider Integration Examples

### SMS (Twilio)

```typescript
import twilio from 'twilio';

const client = twilio(accountSid, authToken);
await client.messages.create({
  body: content,
  to: phone,
  from: twilioNumber,
});
```

### Email (SendGrid)

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(apiKey);
await sgMail.send({
  to: email,
  from: senderEmail,
  subject: subject,
  html: content,
});
```

### Push (Firebase)

```typescript
import admin from 'firebase-admin';

await admin.messaging().send({
  token: deviceToken,
  notification: {
    title: subject,
    body: content,
  },
});
```
