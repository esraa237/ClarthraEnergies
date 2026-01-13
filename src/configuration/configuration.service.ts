import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { IConfiguration } from './entities/configuration.entity';
import { FilesService } from '../files/file.service';
import { FileType } from 'src/files/contstants/file.constant';
import { InjectModel } from '@nestjs/mongoose';
import { I18nContext } from 'nestjs-i18n';

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

    const updatedImages: Record<string, string> = { ...(config.data?.images || {}) };
    const updatedVideos: Record<string, string> = { ...(config.data?.videos || {}) };

    const mainVideoKey = 'main_video';

    // Handle updates specifically for 'main_video'
    if (imageFiles[mainVideoKey] || videoFiles[mainVideoKey]) {
      // Delete any existing file for main_video, regardless of type
      if (updatedImages[mainVideoKey]) {
        await this.filesService.deleteFileByUrl(updatedImages[mainVideoKey]);
        delete updatedImages[mainVideoKey];
      }
      if (updatedVideos[mainVideoKey]) {
        await this.filesService.deleteFileByUrl(updatedVideos[mainVideoKey]);
        delete updatedVideos[mainVideoKey];
      }

      // Save the new file in the correct category
      if (imageFiles[mainVideoKey]) {
        const urls = await this.filesService.saveFilesWithKeys(
          { [mainVideoKey]: imageFiles[mainVideoKey] },
          'config/images',
          this.host,
          FileType.IMAGE
        );
        updatedImages[mainVideoKey] = urls[mainVideoKey];
      } else if (videoFiles[mainVideoKey]) {
        const urls = await this.filesService.saveFilesWithKeys(
          { [mainVideoKey]: videoFiles[mainVideoKey] },
          'config/videos',
          this.host,
          FileType.VIDEO
        );
        updatedVideos[mainVideoKey] = urls[mainVideoKey];
      }
    }
    // Handle the rest of the files normally
    for (const [key, file] of Object.entries(imageFiles)) {
      if (key === mainVideoKey) continue;
      if (updatedImages[key]) await this.filesService.deleteFileByUrl(updatedImages[key]);
      const urls = await this.filesService.saveFilesWithKeys(
        { [key]: file },
        'config/images',
        this.host,
        FileType.IMAGE
      );
      updatedImages[key] = urls[key];
    }

    for (const [key, file] of Object.entries(videoFiles)) {
      if (key === mainVideoKey) continue;
      if (updatedVideos[key]) await this.filesService.deleteFileByUrl(updatedVideos[key]);
      const urls = await this.filesService.saveFilesWithKeys(
        { [key]: file },
        'config/videos',
        this.host,
        FileType.VIDEO
      );
      updatedVideos[key] = urls[key];
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
      throw new NotFoundException(I18nContext.current()!.t('errors.CONFIGURATION.NOT_FOUND'));
    }
    return config.data;
  }
}
