import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ImapModule } from './imap/imap.module';
import { SharedModule } from './shared/shared.module';
import { TextAnalysisModule } from './text-analysis/text-analysis.module';
import { Routes, RouterModule } from 'nest-router';


@Module({
  controllers: [AppController]
})
export class AppModule {}

const routes: Routes = [
  {
    path: '',
    module: AppModule
  },
  {
    path: 'api',
    children: [
      {
        path: 'email',
        module: ImapModule
      },
      {
        path: 'text',
        module: TextAnalysisModule
      }
    ]
  }
];

@Module({
  imports: [
    RouterModule.forRoutes(routes), 
    AppModule,
    SharedModule, 
    ImapModule, 
    TextAnalysisModule
  ],
})
export class RootModule {}
