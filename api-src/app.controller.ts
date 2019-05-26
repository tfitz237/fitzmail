import { Controller, Get, Res, } from '@nestjs/common';
import * as path from 'path';



@Controller()
export class AppController {

  @Get()
  async root(@Res() res) {
    return res.redirect('http://localhost:4200/');
    //return res.sendFile(path.join(__dirname, '../dist', 'browser/index.html'));
  }


}
