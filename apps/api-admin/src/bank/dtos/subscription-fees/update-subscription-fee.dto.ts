import { PartialType } from '@nestjs/swagger';
import { CreateSubscriptionFeeDto } from './create-subscription-fee.dto';

export class UpdateSubscriptionFeeDto extends PartialType(
  CreateSubscriptionFeeDto,
) {}
