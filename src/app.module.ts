import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { SeederModule } from './seeder/seeder.module';
import { FilesModule } from './files/file.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { PagesModule } from './pages/pages.module';
import { extname, join } from 'path';
import * as mime from 'mime-types';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FILE_CONSTANTS } from './files/contstants/file.constant';
import { ServicesModule } from './services/services.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { PositionsModule } from './positions/positions.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://localhost:27017/mydb'),
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
        setHeaders: (res, path) => {
          const contentType = mime.lookup(extname(path));
          if (contentType) {
            res.setHeader('Content-Type', contentType);
          }
          res.setHeader('Content-Disposition', 'inline');
        },
      },
    }),
    ServicesModule,
    ContactUsModule,
    PositionsModule,
    ApplicationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
