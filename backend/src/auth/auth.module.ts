import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module.js";
import { ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";



@Module({ 
    imports:[
        UsersModule,
        JwtModule.registerAsync({
            inject:[ConfigService],
            useFactory:(config:ConfigService)=>({
                secret:config.getOrThrow<string>('JWT_SECRET'),
                signOptions:{
                expiresIn:'1d',
                },
            }),

        }),
    ],
    controllers:[AuthController],
    providers:[AuthService],
    exports:[JwtModule]
})
export class AuthModule{}