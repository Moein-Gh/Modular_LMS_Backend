import {
  CurrentUserId,
  LoanTypesService,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@app/application';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateLoanTypeDto } from './dtos/loan-types/create-loanType.dto';
import { UpdateLoanTypeDto } from './dtos/loan-types/update-loanType.dto';

@Controller('loan-types')
export class LoanTypesController {
  constructor(private readonly loanTypes: LoanTypesService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.loanTypes.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/loanTypes?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.loanTypes.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLoanTypeDto) {
    return this.loanTypes.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateLoanTypeDto,
  ) {
    return this.loanTypes.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.loanTypes.softDelete(id, currentUserId);
    return;
  }
}
