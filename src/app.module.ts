import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImapModule } from './imap/imap.module';
import { ImapService } from './imap/imap.service';
import { SharedModule } from './shared/shared.module';
import { TextAnalysisModule } from './text-analysis/text-analysis.module';

@Module({
  imports: [ImapModule, SharedModule, TextAnalysisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
