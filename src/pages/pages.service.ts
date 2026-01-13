import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilesService } from '../files/file.service';
import { FileType } from 'src/files/contstants/file.constant';
import { IPage } from './entities/pages.entity';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class PagesService {
    private readonly host = process.env.HOST_URL || '';

    constructor(
        @InjectModel('Page') private readonly pageModel: Model<IPage>,
        private readonly filesService: FilesService,
    ) { }

    async createOrUpdate(data: string | Record<string, any>, filesArray: Express.Multer.File[]) {
        // Restructure files array into a map
        const files: Record<string, Express.Multer.File[]> = {};
        for (const file of filesArray) {
            if (!files[file.fieldname]) files[file.fieldname] = [];
            files[file.fieldname].push(file);
        }

        // Parse body data
        let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsedData.data) parsedData = JSON.parse(parsedData.data);

        const { title, ...pageObj } = parsedData;
        if (!title) throw new Error(I18nContext.current()!.t('errors.PAGES.TITLE_REQUIRED'));

        // Split files (images only)
        const imageFiles: Record<string, Express.Multer.File> = {};
        for (const [key, filesArray] of Object.entries(files || {})) {
            const file = filesArray[0];
            if (file.mimetype.startsWith('image/')) imageFiles[key] = file;
        }

        // Check if page exists
        let page = await this.pageModel.findOne({ title });
        if (!page) page = new this.pageModel({ title });

        // Handle images
        const updatedImages: Record<string, string> = { ...(page.data?.images || {}) };
        if (Object.keys(imageFiles).length > 0) {
            for (const [key, file] of Object.entries(imageFiles)) {
                // Delete old file if new one provided
                if (updatedImages[key]) await this.filesService.deleteFileByUrl(updatedImages[key]);
                const urls = await this.filesService.saveFilesWithKeys({ [key]: file }, `pages/${title}/images`, this.host, FileType.IMAGE);
                updatedImages[key] = urls[key];
            }
        }

        // Save data
        page.data = {
            pageObj,
            images: updatedImages,
        };

        await page.save();
        return page.data;
    }

    async getPage(title: string) {
        const page = await this.pageModel.findOne({ title });
        if (!page) throw new NotFoundException(I18nContext.current()!.t('errors.PAGES.NOT_FOUND', { args: { title } }));
        return page.data;
    }

    async getAllPages() {
        const pages = await this.pageModel.find().select('title');
        if (!pages || pages.length === 0) {
            return { message: I18nContext.current()!.t('events.PAGES.NO_PAGES') };
        }
        return pages;
    }

    async getAllPagesPaginated(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [pages, total] = await Promise.all([
            this.pageModel.find()
                .select('title data.pageObj data.images')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.pageModel.countDocuments(),
        ]);

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalItems: total,
            itemsPerPage: limit,
            data: pages,
        };
    }
}
