import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ImapService } from './imap/imap.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly imapService: ImapService,
  ) {}

  @Get()
  async getHello(): Promise<any> {
    return await this.imapService.getEmails();
  }
}
