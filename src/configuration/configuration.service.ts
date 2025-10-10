import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { IConfiguration } from './entities/configuration.entity';
import { FilesService } from '../files/file.service';
import { FileType } from 'src/files/contstants/file.constant';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ConfigurationService {
  private readonly host = process.env.HOST_URL || "";

  constructor(
    @InjectModel('Configuration') private configModel: Model<IConfiguration>,
    private readonly filesService: FilesService,
  ) { }

  async createOrUpdate(data: string | Record<string, any>, files: Record<string, Express.Multer.File[]>) {
    // Parse data
    let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsedData.data) parsedData = JSON.parse(parsedData.data);

    //  Separate files
    const imageFiles: Record<string, Express.Multer.File> = {};
    const videoFiles: Record<string, Express.Multer.File> = {};

    for (const [key, filesArray] of Object.entries(files || {})) {
      const file = filesArray[0];
      if (file.mimetype.startsWith('image/')) imageFiles[key] = file;
      else if (file.mimetype.startsWith('video/')) videoFiles[key] = file;
    }

    // Get existing config
    let config = await this.configModel.findOne();
    if (!config) config = new this.configModel();

    // Handle images: delete old if new exists
    const updatedImages: Record<string, string> = { ...(config.data?.images || {}) };
    if (Object.keys(imageFiles).length > 0) {
      for (const [key, file] of Object.entries(imageFiles)) {
        // delete old file if exists
        if (updatedImages[key]) {
          await this.filesService.deleteFileByUrl(updatedImages[key]);
        }
        // save new file
        const urls = await this.filesService.saveFilesWithKeys({ [key]: file }, 'config/images', this.host, FileType.IMAGE);
        updatedImages[key] = urls[key];
      }
    }

    //  Handle videos similarly
    const updatedVideos: Record<string, string> = { ...(config.data?.videos || {}) };
    if (Object.keys(videoFiles).length > 0) {
      for (const [key, file] of Object.entries(videoFiles)) {
        if (updatedVideos[key]) {
          await this.filesService.deleteFileByUrl(updatedVideos[key]);
        }
        const urls = await this.filesService.saveFilesWithKeys({ [key]: file }, 'config/videos', this.host, FileType.VIDEO);
        updatedVideos[key] = urls[key];
      }
    }
    // Save everything
    config.data = {
      configObj: parsedData,
      images: updatedImages,
      videos: updatedVideos,
    };

    await config.save();
    return config.data;
  }


  async getConfiguration() {
    const config = await this.configModel.findOne();
    if (!config) {
      throw new NotFoundException('No configuration found. Please create one.');
    }
    return config.data;
  }
}
