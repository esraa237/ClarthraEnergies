import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceSchema } from './entities/services.entity';
import { FilesModule } from 'src/files/file.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Service', schema: ServiceSchema }]),
    FilesModule,
    UsersModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServicesModule { }
