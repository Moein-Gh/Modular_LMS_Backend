import { MessageStatus, MessageType, RecipientStatus } from '@app/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageRecipientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  messageId!: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty({ enum: RecipientStatus })
  status!: RecipientStatus;

  @ApiPropertyOptional()
  deliveredAt?: Date;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class MessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: MessageType })
  type!: MessageType;

  @ApiProperty({ enum: MessageStatus })
  status!: MessageStatus;

  @ApiPropertyOptional()
  subject?: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiPropertyOptional()
  scheduledAt?: Date;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [MessageRecipientResponseDto] })
  recipients?: MessageRecipientResponseDto[];
}
