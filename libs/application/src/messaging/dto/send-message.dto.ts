import { MessageType } from '@app/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ enum: MessageType })
  @IsEnum(MessageType)
  @IsNotEmpty()
  type!: MessageType;

  @ApiPropertyOptional()
  @IsString()
  @ValidateIf((o: SendMessageDto) => !o.templateId)
  @IsNotEmpty()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  phones?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emails?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientGroupId?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
