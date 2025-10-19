import { Controller, Post, Body, Get, HttpStatus, Query, UseGuards, Param, Patch } from '@nestjs/common';
import { CreateContactDto, PaginationQueryDto, UpdateReadStatusDto } from './dto/create-contact.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
    @ApiQuery({
        name: 'isRead',
        required: false,
        type: Boolean,
        example: false,
        description: 'Filter by read status (true = read, false = unread). If not provided, all contacts are returned.',
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
                                    representation: "i represent...",
                                    message: "i want ....",
                                    isRead: true,
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
        console.log('Received query:', query);
        return await this.contactService.getAllContacts(query.page, query.limit, query.isRead);
    }

    @Get('/statistics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get contact form statistics (Admins only)' })
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
        description:
            'Filter by month number (1–12). Note: requires "year" query parameter to be provided as well.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Contact statistics summary',
        schema: {
            example: {
                summary: {
                    totalContacts: 45,
                    readCount: 30,
                    unreadCount: 15,
                },
                monthlyDistribution: [
                    { year: 2025, month: 9, count: 10 },
                    { year: 2025, month: 10, count: 5 },
                ],
                selectedMonth: {
                    year: 2025,
                    month: 10,
                    contactsCount: 5,
                },
            },
        },
    })
    async getContactStatistics(
        @Query('year') year?: number,
        @Query('month') month?: number,
    ) {
        return this.contactService.getContactStatistics(year, month);
    }

    @Patch(':id/read-status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update read/unread status for a contact (Admins only)' })
    @ApiParam({ name: 'id', description: 'Contact ID' })
    @ApiBody({ type: UpdateReadStatusDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Contact read status updated successfully.',
        schema: {
            example: {
                message: 'Contact marked as read',
                contact: {
                    _id: '671081fe9a4bff91dce8f3c2',
                    fullName: 'Esraa Foda',
                    email: 'esraa@example.com',
                    isRead: true,
                },
            },
        },
    })
    async updateReadStatus(
        @Param('id') id: string,
        @Body() updateDto: UpdateReadStatusDto,
    ) {
        return this.contactService.updateReadStatus(id, updateDto);
    }
}