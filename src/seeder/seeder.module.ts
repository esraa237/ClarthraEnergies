import { Module, forwardRef } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
