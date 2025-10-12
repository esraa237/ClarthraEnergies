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
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FILE_CONSTANTS } from './files/contstants/file.constant';

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', FILE_CONSTANTS.UPLOAD_DIR),
      serveRoot: `/${FILE_CONSTANTS.UPLOAD_DIR}`,
      serveStaticOptions: {
        index: false, 
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
