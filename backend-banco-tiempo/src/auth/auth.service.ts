import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Este es el método que el controlador no encontraba:
  async login(email: string, pass: string) {
    // 1. Buscamos al usuario por el email usando el método nuevo que creamos
    const user = await this.usersService.findOneByEmail(email);
    
    // 2. Si el usuario existe, comparamos la contraseña escrita con el hash de la DB
    if (user && await bcrypt.compare(pass, user.password)) {
      const payload = { sub: user.id, email: user.email };
      
      // 3. Si todo coincide, generamos y devolvemos el JWT (Token de acceso)
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: { 
          id: user.id,
          nombre: user.nombre, 
          email: user.email 
        }
      };
    }
    
    // 4. Si falla la contraseña o no existe el correo, lanzamos un 401 Unauthorized
    throw new UnauthorizedException('Credenciales incorrectas');
  }
}