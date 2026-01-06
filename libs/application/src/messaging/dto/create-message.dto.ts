import { MessageType } from '@app/domain';
import {
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMessageDto {
  @IsEnum(MessageType)
  @IsNotEmpty()
  type!: MessageType;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsOptional()
  scheduledAt?: Date;

  @IsJSON()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
