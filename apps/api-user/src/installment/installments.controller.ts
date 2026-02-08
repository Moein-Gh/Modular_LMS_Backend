import { InstallmentsService, PaginatedResponseDto } from '@app/application';
import { Installment } from '@app/domain';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetInstallmentsQueryDto } from '../../../api-admin/src/bank/dtos/installments/list-installment.dto';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@Controller('installments')
export class InstallmentsController {
  constructor(private readonly installments: InstallmentsService) {}

  @Get()
  async findAll(
    @Query() query: GetInstallmentsQueryDto,
  ): Promise<PaginatedResponseDto<Installment>> {
    const { items, totalItems, page, pageSize } =
      await this.installments.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/installments?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string): Promise<Installment> {
    return this.installments.findById(id);
  }
}
