import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { FilesModule } from 'src/files/file.module';
import { Application, ApplicationSchema } from './entities/application.entity';
import { UsersModule } from 'src/users/users.module';
import { Position, PositionSchema } from 'src/positions/entities/position.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    MongooseModule.forFeature([{ name: Position.name, schema: PositionSchema }]),
    FilesModule,
    UsersModule
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule { }
