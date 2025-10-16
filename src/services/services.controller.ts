import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Param,
  HttpStatus,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/common/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@Controller('/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Post('/add-or-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create or update a service page (only admins)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Full service data structure',
          properties: {
            title: { type: 'string', example: 'web-development' },
            main_color: { type: 'string', example: '#0055ff' },
            sub_title: { type: 'string', example: 'Build your website with us' },
            paragraph: { type: 'string', example: 'We offer full-stack web services...' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  icon: { type: 'string', example: 'fa-code or file upload name' },
                  title: { type: 'string', example: 'Frontend Development' },
                  points: {
                    type: 'object',
                    example: { point1: 'HTML, CSS', point2: 'React, Angular' },
                  },
                },
              },
            },
            main_button: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Learn More' },
                link: { type: 'string', example: '/services' },
              },
            },
            home_button: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Explore Now' },
                link: { type: 'string', example: '/home' },
              },
            },
          },
        },
        'service-image': { type: 'string', format: 'binary' },
        'serviceName-details-icon-1': { type: 'string', format: 'binary' },
        'serviceName-details-icon-2': { type: 'string', format: 'binary' },
      },
      required: ['data'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service created or updated successfully.',
    schema: {
      example: {
        "serviceObj": {
          "main_color": "#0055ff",
          "sub_title": "Build your website with us",
          "paragraph": "We offer full-stack web services...",
          "details": [
            {
              "icon": "fa-code or file upload name",
              "title": "Frontend Development",
              "points": {
                "point1": "HTML, CSS",
                "point2": "React, Angular"
              }
            }
          ],
          "main_button": {
            "name": "Learn More",
            "link": "/services"
          },
          "home_button": {
            "name": "Explore Now",
            "link": "/home"
          }
        },
        "images": {
          "service-image": "http://localhost:3000/uploads/services/web-development/images/service-image-1760303129827-5a5511a0fcb5.jpg"
        }
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data format or missing required fields.',
    schema: { example: { message: 'Invalid data provided' } },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - missing or invalid token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - only admins can perform this action.',
  })
  @UseInterceptors(
    AnyFilesInterceptor()
  )
  async createOrUpdateService(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() data: string | Record<string, any>,
  ) {
    return this.servicesService.createOrUpdate(data, files);
  }

  @Get('')
  @ApiOperation({ summary: 'Get all services with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default = 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of items per page (default = 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all services with pagination info.',
    schema: {
      example: {
        total: 23,
        page: 1,
        limit: 10,
        totalPages: 3,
        services: [
          {
            _id: '6710fa9a3a5d2b8f27b4f9e1',
            title: 'web-development',
            data: {
              serviceObj: {
                sub_title: 'Build your website with us',
                paragraph: 'We offer full-stack web services...',
              },
              images: {},
            },
          },
        ],
      },
    },
  })
  async getAllServicesPaginated(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.servicesService.getAllServicesPaginated(+page, +limit);
  }

  @Get('/all-titles')
  @ApiOperation({ summary: 'Get all titles and ids of services' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all available services title',
    schema: {
      example: [
        { _id: '671b06b8a8a7e1a3c9321c5d', title: 'web-development' },
        { _id: '671b06b8a8a7e1a3c9321c5e', title: 'mobile-development' },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'No services found.',
    schema: { example: { message: 'No services found' } },
  })
  async getAllTitlesServices() {
    return this.servicesService.getAllServices();
  }

  @Get(':title')
  @ApiOperation({ summary: 'Get specific service content using title and the respose have data that have object and images ,title and _id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully.',
    schema: {
      example: {
        "data": {
          "serviceObj": {
            "main_color": "#0055ff",
            "sub_title": "Build your website with us",
            "paragraph": "We offer full-stack web services...",
            "details": [
              {
                "icon": "fa-code or file upload name",
                "title": "Frontend Development",
                "points": {
                  "point1": "HTML, CSS",
                  "point2": "React, Angular"
                }
              }
            ],
            "main_button": {
              "name": "Learn More",
              "link": "/services"
            },
            "home_button": {
              "name": "Explore Now",
              "link": "/home"
            }
          },
          "images": {
            "service-image": "http://localhost:3000/uploads/services/web-development/images/service-image-1760303678420-67bddf0d5936.jpg"
          }
        },
        "_id": "68ec17d6e181eea0aea366ed",
        "title": "web-development",
        "__v": 0
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found.',
    schema: { example: { message: 'Service not found' } },
  })
  async getService(@Param('title') title: string) {
    return this.servicesService.getService(title);
  }

  @Delete(':title')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a service by title (for Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Service not found' })
  async deleteService(@Param('title') title: string) {
    return this.servicesService.deleteService(title);
  }
}
