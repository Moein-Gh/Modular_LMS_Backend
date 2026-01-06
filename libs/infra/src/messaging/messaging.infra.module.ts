import {
  MESSAGE_REPOSITORY,
  MESSAGE_TEMPLATE_REPOSITORY,
  RECIPIENT_GROUP_REPOSITORY,
} from '@app/domain';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaMessageTemplateRepository } from './repositories/prisma-message-template.repository';
import { PrismaMessageRepository } from './repositories/prisma-message.repository';
import { PrismaRecipientGroupRepository } from './repositories/prisma-recipient-group.repository';

const messageRepositoryProvider = {
  provide: MESSAGE_REPOSITORY,
  useExisting: PrismaMessageRepository,
};

const messageTemplateRepositoryProvider = {
  provide: MESSAGE_TEMPLATE_REPOSITORY,
  useExisting: PrismaMessageTemplateRepository,
};

const recipientGroupRepositoryProvider = {
  provide: RECIPIENT_GROUP_REPOSITORY,
  useExisting: PrismaRecipientGroupRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaMessageRepository,
    PrismaMessageTemplateRepository,
    PrismaRecipientGroupRepository,
    messageRepositoryProvider,
    messageTemplateRepositoryProvider,
    recipientGroupRepositoryProvider,
  ],
  exports: [
    messageRepositoryProvider,
    messageTemplateRepositoryProvider,
    recipientGroupRepositoryProvider,
    PrismaMessageRepository,
    PrismaMessageTemplateRepository,
    PrismaRecipientGroupRepository,
  ],
})
export class MessagingInfraModule {}
