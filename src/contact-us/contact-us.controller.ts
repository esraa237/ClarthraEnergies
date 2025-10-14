import { Controller, Post, Body, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { CreateContactDto, PaginationQueryDto } from './dto/create-contact.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ContactUsService } from './contact-us.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/common/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('ContactUs')
@Controller('contact-us')
export class ContactUsController {
    constructor(private readonly contactService: ContactUsService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a contact/inquiry form' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fullName: { type: 'string', example: 'Esraa Foda' },
                organization: { type: 'string', example: 'Tech Company' },
                email: { type: 'string', example: 'esraa@email.com' },
                areaOfInterest: { type: 'string', example: 'Web Development' },
                representation: { type: 'string', example: 'Company' },
                message: { type: 'string', example: 'I’d like to discuss collaboration.' },
            },
            required: ['fullName', 'email', 'areaOfInterest', 'representation', 'message'],
        },
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Form submitted successfully.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data (validation failed).',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'email must be an email',
                    'fullName should not be empty',
                ],
                error: 'Bad Request',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Unexpected error while saving form data.',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal server error. Please try again later.',
            },
        },
    })
    async submitForm(@Body() body: CreateContactDto) {
        return this.contactService.createContact(body);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get all contact form submissions (Admins only)' })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
        description: 'Page number (default: 1)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 10,
        description: 'Number of items per page (default: 10)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of contacts retrieved successfully.',
        content: {
            'application/json': {
                examples: {
                    withData: {
                        summary: 'When contacts exist',
                        value: {
                            data: [
                                {
                                    _id: '671081fe9a4bff91dce8f3c2',
                                    fullName: 'Esraa Foda',
                                    organization: 'Tech Hub',
                                    email: 'esraa@example.com',
                                    areaOfInterest: 'Web Development',
                                    createdAt: '2025-10-14T20:05:30.000Z',
                                },
                            ],
                            total: 25,
                            page: 1,
                            limit: 10,
                            totalPages: 3,
                        },
                    },
                    empty: {
                        summary: 'When no contacts are found',
                        value: {
                            message: 'No contacts found',
                        },
                    },
                },
            },
        },
    })
    async getAll(@Query() query: PaginationQueryDto) {
        return await this.contactService.getAllContacts(query.page, query.limit);
    }
}