import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { AssistantService } from './assistant.service.js';

class AssistantChatDto {
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsMongoId()
  productId?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timeZone?: string;
}

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  chat(@Body() body: AssistantChatDto) {
    if (!body.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    return this.assistantService.chat(body);
  }
}
