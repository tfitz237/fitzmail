import { Test, TestingModule } from '@nestjs/testing';
import { TextAnalysisController } from './text-analysis.controller';

describe('TextAnalysis Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [TextAnalysisController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: TextAnalysisController = module.get<TextAnalysisController>(TextAnalysisController);
    expect(controller).toBeDefined();
  });
});
