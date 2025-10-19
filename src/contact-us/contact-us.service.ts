
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateContactDto, UpdateReadStatusDto } from './dto/create-contact.dto';
import { Contact } from './entities/contact-us.entity';
import { MailService } from 'src/mail/mail.service';
import { contactUsTemplate } from 'src/mail/contact-us-template';

@Injectable()
export class ContactUsService {
    constructor(
        @InjectModel(Contact.name) private contactModel: Model<Contact>,
        private readonly mailService: MailService
    ) { }

    async createContact(data: CreateContactDto) {
        try {
            const newContact = new this.contactModel(data);
            const savedContact = await newContact.save();

            await this.sendContactEmail(savedContact);
            return {
                message: 'Your message has been sent successfully.',
                data: savedContact,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                'Internal server error. Please try again later.',
            );
        }
    }

    async getAllContacts(page = 1, limit = 10, isRead?: boolean) {
        const skip = (page - 1) * limit;
        const filter: any = {};

        if (isRead !== undefined) {
            filter.isRead = isRead;
        }

        const [data, total] = await Promise.all([
            this.contactModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.contactModel.countDocuments(filter),
        ]);

        if (total === 0) {
            return { message: 'No contacts found' };
        }

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updateReadStatus(id: string, updateDto: UpdateReadStatusDto) {
        const { isRead } = updateDto;

        const contact = await this.contactModel.findByIdAndUpdate(
            id,
            { isRead },
            { new: true },
        );

        if (!contact) throw new NotFoundException('Contact not found');

        return {
            message: `Contact marked as ${isRead ? 'read' : 'unread'}`,
            contact,
        };
    }

    async getContactStatistics(year?: number, month?: number) {
        if (month && !year) {
            throw new HttpException(
                'The "month" filter requires a "year" value as well.',
                HttpStatus.BAD_REQUEST,
            );
        }
        try {
            const totalContacts = await this.contactModel.countDocuments();
            const readCount = await this.contactModel.countDocuments({ isRead: true });
            const unreadCount = await this.contactModel.countDocuments({ isRead: false });

            const matchStage: any = {};
            if (year) matchStage.$expr = { $eq: [{ $year: '$createdAt' }, year] };
            if (month && year)
                matchStage.$expr = {
                    $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, month] },
                    ],
                };

            const monthlyDistribution = await this.contactModel.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        count: 1,
                    },
                },
            ]);

            let selectedMonth: any = null;
            if (year && month) {
                const count = await this.contactModel.countDocuments({
                    $expr: {
                        $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, month] },
                        ],
                    },
                });
                selectedMonth = { year, month, contactsCount: count };
            }

            return {
                summary: {
                    totalContacts,
                    readCount,
                    unreadCount,
                },
                monthlyDistribution,
                selectedMonth,
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve contact statistics');
        }
    }

    private async sendContactEmail(contact: Contact) {
        try {
            const { html, plainText } = contactUsTemplate({
                fullName: contact.fullName,
                organization: contact.organization,
                email: contact.email,
                areaOfInterest: contact.areaOfInterest,
                representation: contact.representation,
                message: contact.message,
            });

            await this.mailService.sendEmail({
                to: process.env.CONTACT_RECEIVER_EMAIL || 'admin@yourcompany.com',
                subject: `📩 New Contact Message from ${contact.fullName}`,
                text: plainText,
                html,
            });
        } catch (error) {
            console.error('Error sending contact email:', error);
            throw new InternalServerErrorException('Failed to send contact message');
        }
    }
}
