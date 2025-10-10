import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationSchema } from './entities/configuration.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesModule } from 'src/files/file.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Configuration', schema: ConfigurationSchema }]),
    FilesModule,
    UsersModule,
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
})
export class ConfigurationModule { }
