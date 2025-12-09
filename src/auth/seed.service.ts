import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const existingAdmin = await this.usersService.findByUsername('admin');

    if (!existingAdmin) {
      await this.usersService.createUser('admin', 'admin123');
      console.log('✅ Usuario admin creado con éxito');
      console.log('   Usuario: admin');
      console.log('   Contraseña: admin123');
    }
  }
}
