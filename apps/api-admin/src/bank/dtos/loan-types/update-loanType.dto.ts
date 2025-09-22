import { PartialType } from '@nestjs/swagger';
import { CreateLoanTypeDto } from './create-loanType.dto';

export class UpdateLoanTypeDto extends PartialType(CreateLoanTypeDto) {}
