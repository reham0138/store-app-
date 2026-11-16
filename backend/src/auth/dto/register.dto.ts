import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";




export class RegisterDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name:string;
    @IsEmail()
    @IsNotEmpty()
    email:string;
    @IsString()
    @MinLength(8)
    password:string;
}