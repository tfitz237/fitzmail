import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
import { SharedModule } from '../shared/shared.module';
import { TextAnalysisModule } from '../text-analysis/text-analysis.module';
import { ImapController } from './imap.controller';

@Module({
  imports: [SharedModule, TextAnalysisModule],
  providers: [ImapService],
  exports: [ImapService],
  controllers: [ImapController]
})
export class ImapModule {}
