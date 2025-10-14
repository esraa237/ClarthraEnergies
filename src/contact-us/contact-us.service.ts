
import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateContactDto } from './dto/create-contact.dto';
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

    async getAllContacts(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.contactModel
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.contactModel.countDocuments(),
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
}
