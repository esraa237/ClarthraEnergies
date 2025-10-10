import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TestModule } from './test/test.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { SeederModule } from './seeder/seeder.module';
import { FilesModule } from './files/file.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { PagesModule } from './pages/pages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://localhost:27017/mydb'),
    // TestModule,
    AuthModule,
    UsersModule,
    MailModule,
    SeederModule,
    FilesModule,
    ConfigurationModule,
    PagesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
