import { Module } from '@nestjs/common';
import { FilesService } from './file.service';
import { FilesController } from './file.controller';

@Module({
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService],
})
export class FilesModule { }
