import { FilesService } from '../files/file.service';
import { Controller, Post, Body, UploadedFiles, UseInterceptors, Req, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ConfigurationService } from './configuration.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/common/role.enum';

@Controller('/config')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService, private readonly filesService: FilesService) { }

  @Post('/add-or-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create or update website configuration' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create configuration with optional images or video',
    schema: {
      type: 'object',
      properties:
      {
        data: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'My Website'
            },
            main_color: { type: 'string', example: '#0044ff' },
            secondary_color: { type: 'string', example: '#00ccff' },
            contact_info: {
              type: 'object',
              properties: {
                email: { type: 'string', example: 'info@example.com' },
                phone: { type: 'string', example: '+20123456789' },
              },
            },
          },
          description: 'Configuration data as object',
        },
        main_logo: { type: 'string', format: 'binary' },
        secondary_logo: { type: 'string', format: 'binary' },
        social_icon1: { type: 'string', format: 'binary' },
        social_icon2: { type: 'string', format: 'binary' },
        main_video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Configuration created successfully',
    schema: {
      example: {
        "configObj": {
          "name": "My Website",
          "main_color": "#0044ff",
          "secondary_color": "#00ccff",
          "contact_info": {
            "email": "info@example.com",
            "phone": "+20123456789"
          }
        },
        "images": {
          "main_logo": "http://localhost:3000/uploads/config/images/main_logo-1760095647492-1dac45b87edd.png",
          "secondary_logo": "http://localhost:3000/uploads/config/images/secondary_logo-1760095647494-888df03d7146.jpeg",
          "social_icon1": "http://localhost:3000/uploads/config/images/social_icon1-1760095647495-5b714a8ccb07.jpeg"
        }
      },
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or file type',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - jwt token wrong or you arenot super admin or admin'
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'main_logo', maxCount: 1 },
      { name: 'secondary_logo', maxCount: 1 },
      { name: 'social_icon1', maxCount: 1 },
      { name: 'social_icon2', maxCount: 1 },
      { name: 'main_video', maxCount: 1 },
    ]),
  )
  async createConfig(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() data: string | Record<string, any>,
  ) {
    return this.configService.createOrUpdate(data, files);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get website configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration retrieved successfully',
    schema: {
      example: {
        "configObj": {
          "name": "My Website 12",
          "main_color": "#0044ff",
          "secondary_color": "#00ccff",
          "contact_info": {
            "email": "info@example.com",
            "phone": "+20123456789"
          }
        },
        "images": {
          "main_logo": "http://localhost:3000/uploads/config/images/main_logo-1760096521624-bde2db72812c.jpg",
          "secondary_logo": "http://localhost:3000/uploads/config/images/secondary_logo-1760096521626-5f3f9d9ac4cb.jpeg",
          "social_icon1": "http://localhost:3000/uploads/config/images/social_icon1-1760096521633-d98e86e76ac3.webp"
        },
        "videos": { 'main_video': 'http://localhost:3000/uploads/config/videos/main_video-1760096521636-3a4f6e8c9f2b.mp4' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No configuration found. Please create one.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - jwt token wrong or you arenot super admin or admin'
  })
  async getConfig() {
    return this.configService.getConfiguration();
  }
}
