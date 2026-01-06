import {
  CreateRecipientGroupDto,
  PaginatedResponseDto,
  PaginationQueryDto,
  RecipientGroupService,
  UpdateRecipientGroupDto,
} from '@app/application';
import { Permissions } from '@app/application/decorators/permissions.decorator';
import { RecipientGroup } from '@app/domain';
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('Recipient Groups')
@Controller('recipient-groups')
export class RecipientGroupController {
  constructor(private readonly recipientGroupService: RecipientGroupService) {}

  @Permissions('recipient-group/create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new recipient group' })
  async create(@Body() dto: CreateRecipientGroupDto): Promise<RecipientGroup> {
    return this.recipientGroupService.create(dto);
  }

  @Permissions('recipient-group/get')
  @Get()
  @ApiOperation({ summary: 'Get all recipient groups' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<RecipientGroup>> {
    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            {
              description: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
          ],
          isDeleted: false,
        }
      : { isDeleted: false };

    const skip = ((query.page || 1) - 1) * (query.pageSize || 20);
    const take = query.pageSize || 20;

    const [items, totalItems] = await Promise.all([
      this.recipientGroupService.findAll({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.recipientGroupService.count(where),
    ]);

    return PaginatedResponseDto.from({
      items,
      totalItems,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      makeUrl: (p, s) => `/recipient-groups?page=${p}&pageSize=${s}`,
    });
  }

  @Permissions('recipient-group/get')
  @Get(':id')
  @ApiOperation({ summary: 'Get recipient group by ID' })
  async findOne(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<RecipientGroup> {
    return this.recipientGroupService.findById(id);
  }

  @Permissions('recipient-group/update')
  @Patch(':id')
  @ApiOperation({ summary: 'Update recipient group' })
  async update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateRecipientGroupDto,
  ): Promise<RecipientGroup> {
    return this.recipientGroupService.update(id, dto);
  }

  @Permissions('recipient-group/delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete recipient group' })
  async softDelete(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.recipientGroupService.softDelete(id);
  }

  @Permissions('recipient-group/restore')
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted recipient group' })
  async restore(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<RecipientGroup> {
    return this.recipientGroupService.restore(id);
  }
}
