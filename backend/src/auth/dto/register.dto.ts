import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";




export class RegisterDto{
   @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
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