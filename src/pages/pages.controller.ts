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
} from '@nestjs/common';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { PagesService } from './pages.service';
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

@Controller('/pages')
export class PagesController {
    constructor(private readonly pageService: PagesService) { }

    @Post('/add-or-update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create or update page content (only admins)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'object',
                    description: 'Full page data structure',
                    properties: {
                        title: {
                            type: 'string',
                            example: 'home',
                            description: 'Page title identifier',
                        },
                        hero_section: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    example: 'Welcome to Our Website',
                                },
                                sub_title: {
                                    type: 'string',
                                    example: 'We build great things.',
                                },
                                buttons: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string', example: 'Learn More' },
                                            link: { type: 'string', example: '/about' },
                                        },
                                    },
                                },
                            },
                        },
                        who_we_are_section: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', example: 'Who We Are' },
                                sub_title: {
                                    type: 'string',
                                    example: 'Our mission and vision.',
                                },
                                button: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string', example: 'Read More' },
                                        link: { type: 'string', example: '/about-us' },
                                    },
                                },
                            },
                        },
                        features_section: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', example: 'Fast' },
                                    sub_title: {
                                        type: 'string',
                                        example: 'Lightning performance',
                                    },
                                },
                            },
                        },
                        cta_section: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', example: 'Join Us Today' },
                                button: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string', example: 'Contact Us' },
                                        link: { type: 'string', example: '/contact' },
                                    },
                                },
                            },
                        },
                    },
                },
                home_hero_image: { type: 'string', format: 'binary' },
                home_about_image: { type: 'string', format: 'binary' },
                home_feature_icon1: { type: 'string', format: 'binary' },
                home_feature_icon2: { type: 'string', format: 'binary' },
                home_feature_icon3: { type: 'string', format: 'binary' },
            },
            required: ['data'],
        },
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Page created or updated successfully',
        schema: {
            example: {
                "pageObj": {
                    "hero_section": {
                        "title": "Welcome to Our Website",
                        "sub_title": "We build great things.",
                        "buttons": [
                            {
                                "name": "Learn More",
                                "link": "/about"
                            }
                        ]
                    },
                    "who_we_are_section": {
                        "title": "Who We Are",
                        "sub_title": "Our mission and vision.",
                        "button": {
                            "name": "Read More",
                            "link": "/about-us"
                        }
                    },
                    "features_section": [
                        {
                            "title": "Fast",
                            "sub_title": "Lightning performance"
                        }
                    ],
                    "cta_section": {
                        "title": "Join Us Today",
                        "button": {
                            "name": "Contact Us",
                            "link": "/contact"
                        }
                    }
                },
                "images": {
                    "home_hero_image": "http://localhost:3000/uploads/pages/home/images/home_hero_image-1760137375949-14b73aecb748.jpeg"
                }
            }
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data or missing title',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Unexpected server error',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - jwt token wrong or you arenot super admin or admin'
    })
    @UseInterceptors(
        AnyFilesInterceptor()
    )
    async createOrUpdatePage(
        @UploadedFiles() files: Record<string, Express.Multer.File[]>,
        @Body() data: string | Record<string, any>,
    ) {
        return this.pageService.createOrUpdate(data, files);
    }
    @Get('')
    @ApiOperation({ summary: 'Get all pages with pagination (full data)' })
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
        description: 'Paginated list of pages',
        schema: {
            example: {
                totalPages: 2,
                currentPage: 1,
                totalItems: 12,
                itemsPerPage: 10,
                data: [
                    {
                        _id: '6710a4c...',
                        title: 'home',
                        data: {
                            pageObj: { hero_section: { title: 'Welcome' } },
                            images: { home_hero_image: 'http://localhost:3000/uploads/pages/home/images/...' },
                        },
                    },
                ],
            },
        },
    })
    async getAllPagesPaginated(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.pageService.getAllPagesPaginated(+page, +limit);
    }

    @Get('/all-titles')
    @ApiOperation({ summary: 'Get all page titles and ids' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of all available pages',
        schema: {
            example: [
                {
                    "_id": "68e98f6da205c6......",
                    "title": "home"
                },
                {
                    "_id": "68sdfffdggfds6......",
                    "title": "about-us"
                },
            ],
        },
    })
    async getAllPages() {
        return this.pageService.getAllPages();
    }

    @Get(':title')
    @ApiOperation({ summary: 'Get specific page content' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Page retrieved successfully',
        schema: {
            example: {
                "pageObj": {
                    "hero_section": {
                        "title": "Welcome to Our Website",
                        "sub_title": "We build great things.",
                        "buttons": [
                            {
                                "name": "Learn More",
                                "link": "/about"
                            }
                        ]
                    },
                    "who_we_are_section": {
                        "title": "Who We Are",
                        "sub_title": "Our mission and vision.",
                        "button": {
                            "name": "Read More",
                            "link": "/about-us"
                        }
                    },
                    "features_section": [
                        {
                            "title": "Fast",
                            "sub_title": "Lightning performance"
                        }
                    ],
                    "cta_section": {
                        "title": "Join Us Today",
                        "button": {
                            "name": "Contact Us",
                            "link": "/contact"
                        }
                    }
                },
                "images": {
                    "home_hero_image": "http://localhost:3000/uploads/pages/home/images/home_hero_image-1760137375949-14b73aecb748.jpeg"
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Page not found',
    })
    async getPage(@Param('title') title: string) {
        return this.pageService.getPage(title);
    }

}
