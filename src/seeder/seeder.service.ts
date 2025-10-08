import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/role.enum';

@Injectable()
export class SeederService {
    private readonly logger = new Logger(SeederService.name);

    constructor(private readonly usersService: UsersService) { }

    async seedSuperAdmin() {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Testadmin1';

        const existingAdmin = await this.usersService.isEmailDuplicated(adminEmail);
        if (existingAdmin) {
            this.logger.log('Super Admin already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, Number(process.env.SALT_NUMBER) || 10);

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
