import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ContactService,
  ContactSubmission,
} from '../application/contact.service';
import { ContactCreateDto } from './contact-create.dto';

/** Stricter rate limit for the public lead-capture endpoint (spam surface). */
const CONTACTS_THROTTLE = { limit: 5, ttl: 60_000 };

@Controller('contacts')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: CONTACTS_THROTTLE })
  async create(@Body() dto: ContactCreateDto): Promise<ContactSubmission> {
    return this.service.submit(dto);
  }
}