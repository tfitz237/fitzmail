import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ImapService } from './imap/imap.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly imapService: ImapService,
  ) {}

  @Get()
  async getEmails(): Promise<any> {
    return await this.imapService.getEmails();
  }

  @Get(':uid')
  async getEmailBody(@Param('uid') uid: number, @Res() res: Response): Promise<any> {
    const body = await this.imapService.getEmailBody({uid});
    res.send(body);
  }
}
