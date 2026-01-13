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
          positionId: "68f29ebf9adc2a84b3d12682",
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
    @Body() body: ApplicationDataDto,
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
    name: 'positionId', required: false, example: "68f291da9adc2a84b3d1266d", description: `Filter applications by related position.
- Leave empty → returns all applications
- Send a specific Position ID → returns only applications linked to that position
- Send 'none' → returns applications with **no position assigned**` })
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
            position: {
              "_id": "68f29ebf9adc2a84b3d12682",
              "name": "job",
              "location": "Egypt",
              "type": "Full-time"
            },
            createdAt: '2025-10-16T12:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unexpected server error' })
  async getAll(@Query('page') page = 1, @Query('limit') limit = 10, @Query('status') status?: 'pending' | 'approved' | 'rejected' | 'contacted', @Query('positionId') positionId?: string): Promise<any> {
    return this.appService.getAll(+page, +limit, status, positionId);
  }

  @Get('/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get detailed applications statistics (Admins only)' })
  @ApiQuery({
    name: 'year',
    required: false,
    example: 2025,
    description: 'Filter by year (e.g. 2025)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    example: 10,
    description: 'Filter by month number (1–12). Note: requires "year" query parameter to be provided as well.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comprehensive applications statistics summary',
    schema: {
      example: {
        summary: {
          totalApplications: 120,
          thisMonthCount: 15,
        },
        monthlyDistribution: [
          { year: 2025, month: 'Sep', count: 10 },
          { year: 2025, month: 'Oct', count: 15 },
        ],
        filteredMonth: {
          year: 2025,
          month: 'Oct',
          count: 15,
        },
        byPosition: [
          { position: 'Frontend Developer', count: 25 },
          { position: 'Backend Developer', count: 18 },
          { position: 'UI/UX Designer', count: 7 },
          { position: 'No position', count: 3 },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve applications statistics',
  })
  async getApplicationsStatistics(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.appService.getApplicationsStatistics(year, month);
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
        position: {
          "_id": "68f29ebf9adc2a84b3d12682",
          "name": "job",
          "location": "Egypt",
          "type": "Full-time"
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
