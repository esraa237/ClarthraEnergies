
import {
    Controller,
    Post,
    UploadedFiles,
    UseInterceptors,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './file.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileType } from './contstants/file.constant';

@ApiTags('Files for backend tests')
@Controller('files')
export class FilesController {
    constructor(private readonly fileService: FilesService) { }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: Object.values (FileType),
                    example: 'image',
                },
                path: { type: 'string', example: 'banners' },
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    async uploadFiles(
        @Body('path') path: string,
        @Body('type') type: FileType,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        const urls = await this.fileService.saveFiles(files, path, process.env.HOST_URL || "", type);
        return { message: 'Files uploaded successfully', urls };
    }
}
