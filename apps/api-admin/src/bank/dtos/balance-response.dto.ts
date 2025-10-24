import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({
    description: 'The balance amount as a string to preserve precision',
    example: '1000000.0000',
  })
  balance: string;
}
