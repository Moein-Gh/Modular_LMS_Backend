import { MessageStatus, MessageType, RecipientStatus } from '@app/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageTemplateInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: MessageType })
  type!: MessageType;

  @ApiPropertyOptional()
  subject?: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: [String] })
  variables!: string[];

  @ApiProperty()
  isActive!: boolean;
}

export class UserIdentityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  phone!: string;

  @ApiPropertyOptional()
  name!: string | null;

  @ApiPropertyOptional()
  countryCode!: string | null;

  @ApiPropertyOptional()
  email!: string | null;
}

export class RecipientUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: number;

  @ApiPropertyOptional()
  identityId?: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ type: UserIdentityDto })
  identity?: UserIdentityDto;
}

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

  @ApiPropertyOptional()
  renderedContent?: string;

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

  @ApiPropertyOptional({ type: RecipientUserDto })
  user?: RecipientUserDto;
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

  @ApiPropertyOptional({ type: MessageTemplateInfoDto })
  template?: MessageTemplateInfoDto;

  @ApiPropertyOptional({ type: [MessageRecipientResponseDto] })
  recipients?: MessageRecipientResponseDto[];
}
