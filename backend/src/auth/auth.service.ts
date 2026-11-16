import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto.js';
import  * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const email = dto.email.toLocaleLowerCase().trim();
    const existingUser = await this.userService.findByEmail(email);
    if (!existingUser) {
      throw new ConflictException('email already register');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      name: dto.name,
      email,
      passwordHash,
    });
    return this.CreateToken(user);
  }
  async Login(dto:LoginDto){
    const email=dto.email.toLocaleLowerCase().trim();   
    const user=await this.userService.findByEmail(email);
    if(!user){
        throw new UnauthorizedException('invalid email or password')
    }
    const passwordMatches=await bcrypt.compare(
        dto.password,
        user.passWordHash
    );
    if(!passwordMatches){
        throw new UnauthorizedException('invalid email or password ')
    }
    return this.CreateToken(user);
  }
  private async CreateToken(user:any){
    const payload={
        sub:user._id.toString(),
        role:user.role,
    }
    const accessToken=await this.jwtService.signAsync(payload);
    return{
        accessToken,
        user:{
            id:user._id.toString(),
            name:user.name,
            email:user.email,
            role:user.role

        },
    };
  }
}
