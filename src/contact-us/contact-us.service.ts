
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateContactDto, UpdateReadStatusDto } from './dto/create-contact.dto';
import { Contact } from './entities/contact-us.entity';

@Injectable()
export class ContactUsService {
    constructor(
        @InjectModel(Contact.name) private contactModel: Model<Contact>,
    ) { }

    async createContact(data: CreateContactDto) {
        try {
            const newContact = new this.contactModel(data);
            return newContact.save();
        } catch (error) {
            throw new InternalServerErrorException(
                'Internal server error. Please try again later.',
            );
        }
    }

    async getAllContacts(page = 1, limit = 10, isRead?: boolean) {
        const skip = (page - 1) * limit;
        const filter: any = {};

        // 🔹 Apply filter only if user explicitly sends is_read
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
}
