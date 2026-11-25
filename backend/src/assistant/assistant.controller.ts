import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AssistantChatDto } from './assistant.dto.js';
import { AssistantService } from './assistant.service.js';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  // Public endpoint that may call a language model: stricter than the global limit.
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('chat')
  chat(@Body() body: AssistantChatDto) {
    if (!body.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    return this.assistantService.chat(body);
  }
}
