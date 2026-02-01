import { MessageStatus, MessageType } from '@app/domain';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MessageQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MessageType })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiPropertyOptional({ enum: MessageStatus })
  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by recipient user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Include recipients in response' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeRecipients?: boolean;

  @ApiPropertyOptional({ description: 'Include deleted messages' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
