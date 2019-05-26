import { Controller, Get, Param, Res } from '@nestjs/common';
import { ImapService } from './imap.service';
import { Response } from 'express';

@Controller()
export class ImapController {
  constructor(
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
