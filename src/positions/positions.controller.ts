// positions.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto, PaginatedPositionsResponseDto, PaginationDto, PositionWithApplicationsDto } from './dto/position.dto';
import {
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

import { Position } from './entities/position.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { LocalizationInterceptor } from 'src/common/interceptors/localization.interceptor';

@ApiTags('Positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new position (for Admin only)' })
  @ApiBody({ type: CreatePositionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Position created successfully.',
    type: Position,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Server error.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - jwt token wrong or you arenot super admin or admin'
  })
  async create(@Body() body: CreatePositionDto): Promise<Position> {
    return this.positionsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all positions (with pagination)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of positions (paginated).',
    type: PaginatedPositionsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Server error.' })
  @UseInterceptors(LocalizationInterceptor)
  async findAll(@Query() query: PaginationDto) {
    return this.positionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single position by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get a position by ID.',
    type: PositionWithApplicationsDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Position not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Server error.' })
  @UseInterceptors(LocalizationInterceptor)
  async findOne(@Param('id') id: string): Promise<Position> {
    return this.positionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an existing position (for Admin only)' })
  @ApiBody({ type: CreatePositionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Position updated successfully.',
    type: Position,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format or data.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Position not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Server error.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - jwt token wrong or you arenot super admin or admin'
  })
  async update(
    @Param('id') id: string,
    @Body() body: CreatePositionDto,
  ): Promise<Position> {
    return this.positionsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a position and related applications by ID (for Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Position deleted successfully.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Position not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Server error.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - jwt token wrong or you arenot super admin or admin'
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.positionsService.delete(id);
  }
}
