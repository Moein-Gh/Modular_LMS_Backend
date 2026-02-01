import {
  CurrentUserId,
  MessageQueryDto,
  MessageRecipientResponseDto,
  MessageResponseDto,
  MessagingService,
  PaginatedResponseDto,
  SendMessageDto,
  UpdateMessageDto,
  UpdateRecipientStatusDto,
} from '@app/application';
import { Permissions } from '@app/application/decorators/permissions.decorator';
import { Message, MessageRecipient } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('Messaging')
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Permissions('message/send')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a new message' })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messagingService.sendMessage(dto, currentUserId);
    return this.mapToResponseDto(message);
  }

  @Permissions('message/get')
  @Get()
  @ApiOperation({ summary: 'Get all messages with pagination' })
  async findAll(
    @Query() query: MessageQueryDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<PaginatedResponseDto<MessageResponseDto>> {
    const { items, totalItems } = await this.messagingService.getMessages(
      query,
      currentUserId,
    );

    return PaginatedResponseDto.from({
      items: items.map((item) => this.mapToResponseDto(item)),
      totalItems,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      makeUrl: (p, s) => `/messages?page=${p}&pageSize=${s}`,
    });
  }

  @Permissions('message/get')
  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  async findOne(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messagingService.findById(id);
    return this.mapToResponseDto(message);
  }

  @Permissions('message/update')
  @Patch(':id')
  @ApiOperation({ summary: 'Update message' })
  async update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagingService.update(id, dto);
    return this.mapToResponseDto(message);
  }

  @Permissions('message/update')
  @Patch('recipients/:recipientId/status')
  @ApiOperation({ summary: 'Update recipient status' })
  async updateRecipientStatus(
    @Param('recipientId', UUID_V4_PIPE) recipientId: string,
    @Body() dto: UpdateRecipientStatusDto,
  ): Promise<MessageRecipient> {
    return this.messagingService.updateRecipientStatus(recipientId, dto);
  }

  @Permissions('message/delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete message' })
  async softDelete(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.messagingService.softDelete(id);
  }

  @Permissions('message/restore')
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted message' })
  async restore(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messagingService.restore(id);
    return this.mapToResponseDto(message);
  }

  private mapToResponseDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      type: message.type,
      status: message.status,
      subject: message.subject ?? undefined,
      content: message.content,
      templateId: message.templateId ?? undefined,
      scheduledAt: message.scheduledAt ?? undefined,
      sentAt: message.sentAt ?? undefined,
      metadata: message.metadata as Record<string, unknown> | undefined,
      createdBy: message.createdBy ?? undefined,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      template: message.template
        ? {
            id: message.template.id,
            code: message.template.code,
            name: message.template.name,
            type: message.template.type,
            subject: message.template.subject ?? undefined,
            content: message.template.content,
            variables: message.template.variables,
            isActive: message.template.isActive,
          }
        : undefined,
      recipients: message.recipients?.map((r) => ({
        id: r.id,
        messageId: r.messageId,
        userId: r.userId ?? undefined,
        phone: r.phone ?? undefined,
        email: r.email ?? undefined,
        renderedContent: r.renderedContent ?? undefined,
        status: r.status,
        deliveredAt: r.deliveredAt ?? undefined,
        readAt: r.readAt ?? undefined,
        errorMessage: r.errorMessage ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.user
          ? {
              id: r.user.id,
              code: r.user.code,
              identityId: r.user.identityId ?? undefined,
              status: r.user.status,
              identity: r.user.identity
                ? {
                    id: r.user.identity.id,
                    phone: r.user.identity.phone,
                    name: r.user.identity.name,
                    countryCode: r.user.identity.countryCode,
                    email: r.user.identity.email,
                  }
                : undefined,
            }
          : undefined,
      })) as MessageRecipientResponseDto[],
    };
  }
}
