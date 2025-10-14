import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilesService } from '../files/file.service';
import { FileType } from 'src/files/contstants/file.constant';
import { IService } from './entities/services.entity';

@Injectable()
export class ServicesService {
  private readonly host = process.env.HOST_URL || '';

  constructor(
    @InjectModel('Service') private readonly serviceModel: Model<IService>,
    private readonly filesService: FilesService,
  ) { }

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

    const { title, ...serviceObj } = parsedData;
    if (!title) throw new Error('Service title is required');

    // Filter image files
    const imageFiles: Record<string, Express.Multer.File> = {};
    for (const [key, filesArray] of Object.entries(files || {})) {
      const file = filesArray[0];
      if (file.mimetype.startsWith('image/')) imageFiles[key] = file;
    }

    // Check if service exists
    let service = await this.serviceModel.findOne({ title });
    if (!service) service = new this.serviceModel({ title });

    // Handle image updates
    const updatedImages: Record<string, string> = { ...(service.data?.images || {}) };
    if (Object.keys(imageFiles).length > 0) {
      for (const [key, file] of Object.entries(imageFiles)) {
        if (updatedImages[key]) await this.filesService.deleteFileByUrl(updatedImages[key]);
        const urls = await this.filesService.saveFilesWithKeys(
          { [key]: file },
          `services/${title}/images`,
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

    await service.save();
    return service;
  }

  async getService(title: string) {
    const service = await this.serviceModel.findOne({ title });
    if (!service) throw new NotFoundException(`Service '${title}' not found`);
    return service;
  }

  async getAllServices() {
    const services = await this.serviceModel.find().select('title');
    if (!services || services.length === 0) return { message: 'No services found' };
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
      return { message: 'No services found', total: 0, page, limit };

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      services,
    };
  }

}
