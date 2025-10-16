import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationDataDto, CreateApplicationDto } from './dto/application.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/role.enum';

@ApiTags('Applications')
@Controller('/applications')
export class ApplicationsController {
  constructor(private readonly appService: ApplicationsService) { }

  @Post('/create')
  @ApiOperation({ summary: 'Submit a new job application' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Application submitted successfully',
    schema: {
      example: {
        message: 'Application submitted successfully',
        application: {
          _id: '6710a4c...',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+201001234567',
          location: 'Cairo',
          expectedSalary: 15000,
          files: {
            cv: 'http://localhost:3000/uploads/applications/cv-123abc.pdf',
            coverLetter: 'http://localhost:3000/uploads/applications/cover-456xyz.pdf',
            employeeReference: null,
            certificate: null,
            other: null,
          },
          status: 'pending',
          createdAt: '2025-10-16T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or missing required fields' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unexpected server error' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cv', maxCount: 1 },
      { name: 'coverLetter', maxCount: 1 },
      { name: 'employeeReference', maxCount: 1 },
      { name: 'certificate', maxCount: 1 },
      { name: 'other', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() body: any,
  ) {
    return this.appService.create(body, files);
  }

  @Get('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all applications (paginated and filtered) (Admins only)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of records per page' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected', 'contacted'],
    description: 'Filter applications by status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of applications',
    schema: {
      example: {
        totalItems: 42,
        totalPages: 5,
        currentPage: 1,
        data: [
          {
            _id: '6710a4c...',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+201001234567',
            location: 'Cairo',
            expectedSalary: 15000,
            files: {
              cv: 'http://localhost:3000/uploads/applications/cv-123abc.pdf',
              coverLetter: null,
              employeeReference: null,
              certificate: null,
              other: null,
            },
            status: 'pending',
            createdAt: '2025-10-16T12:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unexpected server error' })
  async getAll(@Query('page') page = 1, @Query('limit') limit = 10, @Query('status') status?: 'pending' | 'approved' | 'rejected' | 'contacted',) {
    return this.appService.getAll(+page, +limit, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get application by ID (Admins only)' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application retrieved successfully',
    schema: {
      example: {
        _id: '6710a4c...',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+201001234567',
        location: 'Cairo',
        expectedSalary: 15000,
        files: {
          cv: 'http://localhost:3000/uploads/applications/cv-123abc.pdf',
          coverLetter: null,
          employeeReference: null,
          certificate: null,
          other: null,
        },
        status: 'pending',
        createdAt: '2025-10-16T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  async getById(@Param('id') id: string) {
    return this.appService.getById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an application by ID (Admins only)' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application deleted successfully', schema: { example: { message: "Application with ID '6710a4c...' deleted successfully" } } })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  async deleteApplication(@Param('id') id: string) {
    return this.appService.deleteById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update status for an application by ID (Admins only)' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiQuery({
    name: 'status',
    required: true,
    enum: ['pending', 'approved', 'rejected', 'contacted'],
    description: 'Update status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application status updated successfully',
    schema: {
      example: {
        message: "Application status updated to 'approved'",
        application: {
          _id: '6710a4c...',
          firstName: 'John',
          lastName: 'Doe',
          status: 'approved',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Application not found or invalid status' })
  async updateStatus(
    @Param('id') id: string,
    @Query('status') status: 'pending' | 'approved' | 'rejected' | 'contacted',
  ) {
    return this.appService.updateStatus(id, status);
  }
}
