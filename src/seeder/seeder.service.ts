import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/role.enum';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly usersService: UsersService) {}

  async seedSuperAdmin() {
    // Check by ROLE (not by email), so changing the super admin's email
    // never causes a new default super admin to be created.
    const superAdminExists = await this.usersService.hasSuperAdmin();
    if (superAdminExists) {
      this.logger.log('Super Admin already exists.');
      return;
    }

    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    // No insecure hardcoded fallbacks
    if (!adminEmail || !adminPassword) {
      this.logger.error(
        'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env to seed the Super Admin.',
      );
      return;
    }

    // Safety: don't crash on a duplicate email if a non-super-admin user already uses it
    const emailTaken = await this.usersService.isEmailDuplicated(adminEmail);
    if (emailTaken) {
      this.logger.warn(
        `A user with email ${adminEmail} already exists but is not a Super Admin. Skipping seeding.`,
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      Number(process.env.SALT_NUMBER) || 10,
    );

    await this.usersService.createUser({
      email: adminEmail,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      isProfileCompleted: true,
      userName: 'SuperAdmin',
      fullName: 'System Super Admin',
    });

    this.logger.log('Super Admin created successfully!');
  }
}