import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { Throttle } from "@nestjs/throttler";



@Controller('auth')
export class AuthController{
    constructor(private authService:AuthService){}
    @Post('register')
    register(@Body() dto:RegisterDto){
        return this.authService.register(dto);

    }
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    login(@Body() dto:LoginDto){
        return this.authService.Login(dto);
        
    }
    @Get('me')
    async getMe(@Req() req:any){
        if(!req.user?.sub){
            throw new UnauthorizedException('Authentecation required')
        }
        return this.authService.getMe(req.user.sub);
    }
}