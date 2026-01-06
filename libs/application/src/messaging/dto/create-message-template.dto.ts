import { MessageType } from '@app/domain';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMessageTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MessageType)
  @IsNotEmpty()
  type!: MessageType;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsArray()
  @IsString({ each: true })
  variables!: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
