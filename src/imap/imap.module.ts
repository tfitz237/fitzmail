import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [ImapService],
  exports: [ImapService],
})
export class ImapModule {}
