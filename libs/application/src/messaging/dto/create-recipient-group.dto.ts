import {
  IsBoolean,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRecipientGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  @IsNotEmpty()
  criteria!: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
