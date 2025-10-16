import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Position, PositionSchema } from './entities/position.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Position.name, schema: PositionSchema }]), UsersModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule { }
