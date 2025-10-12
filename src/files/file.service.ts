import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { FILE_CONSTANTS } from './contstants/file.constant';
import { FileType } from './contstants/file.constant';

@Injectable()
export class FilesService {
  private readonly basePath = path.join(process.cwd(), FILE_CONSTANTS.UPLOAD_DIR);
  private readonly ALLOWED_EXTENSIONS = {
    image: (process.env.ALLOWED_IMAGE_EXTENSIONS || '.jpg,.jpeg,.png').split(','),
    video: (process.env.ALLOWED_VIDEO_EXTENSIONS || '.mp4,.mov').split(','),
    file: (process.env.ALLOWED_FILE_EXTENSIONS || '.pdf,.doc,.docx').split(','),
  }
  async saveFiles(
    files: Express.Multer.File[] | Express.Multer.File,
    folder: string,
    host: string,
    type: FileType,
  ): Promise<{ saved: string[]; failed: { file: string; reason: string }[] }> {
    const filesArray = Array.isArray(files) ? files : [files];
    const targetDir = path.join(this.basePath, folder);

    if (!existsSync(this.basePath)) mkdirSync(this.basePath, { recursive: true });
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    const saved: string[] = [];
    const failed: { file: string; reason: string }[] = [];

    for (const file of filesArray) {
      try {
        this.validateFile(file, type);

        const ext = this.getExtension(file.originalname);
        const uniqueName = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
        const filePath = path.join(targetDir, uniqueName);

        writeFileSync(filePath, file.buffer);
        saved.push(`${host}/${FILE_CONSTANTS.UPLOAD_DIR}/${folder}/${uniqueName}`);
      } catch (error) {
        failed.push({
          file: file.originalname,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return { saved, failed };
  }

  async saveFilesWithKeys(
    files: Record<string, Express.Multer.File>,
    folder: string,
    host: string,
    type: FileType,
  ): Promise<{ [key: string]: string }> {
    if (!files || Object.keys(files).length === 0)
      throw new BadRequestException(FILE_CONSTANTS.MESSAGES.NO_FILE);

    const targetDir = path.join(this.basePath, folder);
    if (!existsSync(this.basePath)) mkdirSync(this.basePath, { recursive: true });
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    const savedFiles: Record<string, string> = {};

    for (const [key, file] of Object.entries(files)) {
      try {
        this.validateFile(file, type);

        const ext = this.getExtension(file.originalname);
        const uniqueName = `${key}-${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
        const filePath = path.join(targetDir, uniqueName);

        writeFileSync(filePath, file.buffer);
        savedFiles[key] = `${host}/${FILE_CONSTANTS.UPLOAD_DIR}/${folder}/${uniqueName}`;
      } catch (error) {
        throw new BadRequestException(`Failed to save file for key "${key}": ${error.message}`);
      }
    }
    return savedFiles;
  }


  private validateFile(file: Express.Multer.File, type: FileType) {
    if (!file) throw new BadRequestException(FILE_CONSTANTS.MESSAGES.NO_FILE);

    const { mimetype, size, originalname } = file;
    const maxSize = FILE_CONSTANTS.MAX_SIZES[type];
    const allowedExts = this.ALLOWED_EXTENSIONS[type].map(e => e.toLowerCase());
    const fileExt = this.getExtension(originalname).toLowerCase();

    if (type === FileType.IMAGE && !mimetype.startsWith('image/'))
      throw new BadRequestException(FILE_CONSTANTS.MESSAGES.INVALID_TYPE.image);
    if (type === FileType.VIDEO && !mimetype.startsWith('video/'))
      throw new BadRequestException(FILE_CONSTANTS.MESSAGES.INVALID_TYPE.video);
    if (type === FileType.FILE && (mimetype.startsWith('image/') || mimetype.startsWith('video/')))
      throw new BadRequestException(FILE_CONSTANTS.MESSAGES.INVALID_TYPE.file);

    if (!allowedExts.includes(fileExt))
      throw new BadRequestException(FILE_CONSTANTS.MESSAGES.INVALID_EXTENSION(allowedExts));

    if (size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(FILE_CONSTANTS.MESSAGES.TOO_LARGE(maxMB));
    }
  }

  async deleteFileByUrl(fileUrl: string) {
    try {
      if (!fileUrl || typeof fileUrl !== 'string') {
        console.warn('deleteFileByUrl called with invalid URL:', fileUrl);
        return;
      }

      const host = process.env.HOST_URL || '';
      const relativePath = fileUrl.replace(`${host}/`, '')
        .replace(`${FILE_CONSTANTS.UPLOAD_DIR}/`, '') // remove base upload dir
        .replace(/^\/+/, ''); // remove host + leading slash
      const filePath = path.join(this.basePath, relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }

  private getExtension(filename: string): string {
    return path.extname(filename) || '';
  }
}
