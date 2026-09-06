import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { FilesService } from '../files/file.service';
import { FileType } from 'src/files/contstants/file.constant';
import { IService } from './entities/services.entity';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class ServicesService {
  private readonly host = process.env.HOST_URL || '';

  constructor(
    @InjectModel('Service') private readonly serviceModel: Model<IService>,
    private readonly filesService: FilesService,
  ) {}

  async createOrUpdate(
    data: string | Record<string, any>,
    filesArray: Express.Multer.File[],
  ) {
    // Restructure files array into a map
    const files: Record<string, Express.Multer.File[]> = {};
    for (const file of filesArray) {
      if (!files[file.fieldname]) files[file.fieldname] = [];
      files[file.fieldname].push(file);
    }

    // Parse body
    let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsedData.data) parsedData = JSON.parse(parsedData.data);

    const { _id, title, ...serviceObj } = parsedData;
    if (!title)
      throw new Error(
        I18nContext.current()!.t('errors.SERVICES.TITLE_REQUIRED'),
      );

    // Filter image files
    const imageFiles: Record<string, Express.Multer.File> = {};
    for (const [key, filesArray] of Object.entries(files || {})) {
      const file = filesArray[0];
      if (file.mimetype.startsWith('image/')) imageFiles[key] = file;
    }

    // Check if service exists
    let service: IService | null = null;
    if (_id) {
      if (!isValidObjectId(_id)) {
        throw new NotFoundException(
          this.t('errors.SERVICES.NOT_FOUND', { args: { title: _id } }),
        );
      }
      service = await this.serviceModel.findById(_id);
      if (!service) {
        throw new NotFoundException(
          this.t('errors.SERVICES.NOT_FOUND', { args: { title: _id } }),
        );
      }
    } else {
      service = new this.serviceModel({ title });
    }

    service.title = title;

    // Handle image updates
    const updatedImages: Record<string, string> = {
      ...(service.data?.images || {}),
    };
    if (Object.keys(imageFiles).length > 0) {
      for (const [key, file] of Object.entries(imageFiles)) {
        if (updatedImages[key])
          await this.filesService.deleteFileByUrl(updatedImages[key]);
        const urls = await this.filesService.saveFilesWithKeys(
          { [key]: file },
          `services/${service._id}/images`,
          this.host,
          FileType.IMAGE,
        );
        updatedImages[key] = urls[key];
      }
    }

    // Save data
    service.data = {
      serviceObj,
      images: updatedImages,
    };

    try {
      await service.save();
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(
          this.t('errors.SERVICES.VALIDATION_ERROR') || error.message,
        );
      }
      throw error;
    }
    return service;
  }

  async getService(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(
        this.t('errors.SERVICES.NOT_FOUND', { args: { title: id } }),
      );
    }
    const service = await this.serviceModel.findById(id);
    if (!service)
      throw new NotFoundException(
        this.t('errors.SERVICES.NOT_FOUND', { args: { title: id } }),
      );
    return service;
  }

  async getServiceByTitle(title: string) {
    const service = await this.serviceModel.findOne({
      $or: [
        { 'title.en': title },
        { 'title.fr': title },
        { 'title.zh': title },
        { title: title },
      ],
    });
    if (!service)
      throw new NotFoundException(
        this.t('errors.SERVICES.NOT_FOUND', { args: { title } }),
      );
    return service;
  }

  async getAllServices() {
    const services = await this.serviceModel.find().select('title');
    if (!services || services.length === 0)
      return { message: this.t('events.SERVICES.NO_SERVICES') };
    return services;
  }

  async getAllServicesPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.serviceModel
        .find()
        .select('title data.serviceObj data.images')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.serviceModel.countDocuments(),
    ]);

    if (!services || services.length === 0)
      return {
        message: this.t('events.SERVICES.NO_SERVICES'),
        total: 0,
        page,
        limit,
      };

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      services,
    };
  }

  async deleteService(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(
        this.t('errors.SERVICES.NOT_FOUND', { args: { title: id } }),
      );
    }
    const service = await this.serviceModel.findById(id);
    if (!service) {
      throw new NotFoundException(
        this.t('errors.SERVICES.NOT_FOUND', { args: { title: id } }),
      );
    }

    // Delete any associated files (e.g., images)
    if (service.data?.images) {
      const imageUrls = Object.values(service.data.images);
      for (const url of imageUrls) {
        if (typeof url === 'string') {
          await this.filesService.deleteFileByUrl(url);
        }
      }
    }

    await this.serviceModel.deleteOne({ _id: service._id });
    return {
      message: this.t('events.SERVICES.DELETE_SUCCESS', {
        args: { title: id },
      }),
    };
  }

  private t(key: string, options?: any): string {
    const i18n = I18nContext.current();
    if (i18n) {
      return i18n.t(key, options);
    }
    return key;
  }
}
