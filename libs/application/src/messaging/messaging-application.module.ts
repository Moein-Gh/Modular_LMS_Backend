import { MessagingInfraModule } from '@app/infra/messaging/messaging.infra.module';
import { UserInfraModule } from '@app/infra/user/user.infra.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MessagingProcessor } from './queues/messaging.processor';
import { MessageTemplateService } from './services/message-template.service';
import { MessagingService } from './services/messaging.service';
import { RecipientGroupService } from './services/recipient-group.service';

@Module({
  imports: [
    MessagingInfraModule,
    UserInfraModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    BullModule.registerQueue({ name: 'messaging' }),
    BullModule.registerQueue({ name: 'scheduled-messages' }),
  ],
  providers: [
    MessagingService,
    MessageTemplateService,
    RecipientGroupService,
    MessagingProcessor,
  ],
  exports: [
    MessagingService,
    MessageTemplateService,
    RecipientGroupService,
    MessagingProcessor,
  ],
})
export class MessagingApplicationModule {}
