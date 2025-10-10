import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PageSchema } from './entities/pages.entity';
import { FilesModule } from 'src/files/file.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Page', schema: PageSchema }]),
    FilesModule,
    UsersModule,
  ],
  providers: [PagesService],
  controllers: [PagesController]
})
export class PagesModule { }
