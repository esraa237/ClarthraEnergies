import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Position, PositionSchema } from './entities/position.entity';
import { UsersModule } from 'src/users/users.module';
import { Application, ApplicationSchema } from 'src/applications/entities/application.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Position.name, schema: PositionSchema }]), MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]), UsersModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule { }
