import {
  CreateMessageTemplateDto,
  MessageTemplateService,
  PaginatedResponseDto,
  PaginationQueryDto,
  UpdateMessageTemplateDto,
} from '@app/application';
import { Permissions } from '@app/application/decorators/permissions.decorator';
import { MessageTemplate } from '@app/domain';
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

@ApiTags('Message Templates')
@Controller('message-templates')
export class MessageTemplateController {
  constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @Permissions('message-template/create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new message template' })
  async create(
    @Body() dto: CreateMessageTemplateDto,
  ): Promise<MessageTemplate> {
    return this.messageTemplateService.create(dto);
  }

  @Permissions('message-template/get')
  @Get()
  @ApiOperation({ summary: 'Get all message templates' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<MessageTemplate>> {
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
      this.messageTemplateService.findAll({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.messageTemplateService.count(where),
    ]);

    return PaginatedResponseDto.from({
      items,
      totalItems,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      makeUrl: (p, s) => `/message-templates?page=${p}&pageSize=${s}`,
    });
  }

  @Permissions('message-template/get')
  @Get(':id')
  @ApiOperation({ summary: 'Get message template by ID' })
  async findOne(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<MessageTemplate> {
    return this.messageTemplateService.findById(id);
  }

  @Permissions('message-template/update')
  @Patch(':id')
  @ApiOperation({ summary: 'Update message template' })
  async update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ): Promise<MessageTemplate> {
    return this.messageTemplateService.update(id, dto);
  }

  @Permissions('message-template/delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete message template' })
  async softDelete(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.messageTemplateService.softDelete(id);
  }

  @Permissions('message-template/restore')
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted message template' })
  async restore(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<MessageTemplate> {
    return this.messageTemplateService.restore(id);
  }
}
