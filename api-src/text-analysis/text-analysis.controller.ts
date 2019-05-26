import { Controller, Body, Post } from '@nestjs/common';
import { TextAnalysisService } from './text-analysis.service';

@Controller()
export class TextAnalysisController {
    constructor(private readonly textAnalysisService: TextAnalysisService) {}

    @Post('categories')
    async getCategories(@Body() query: any) {
        return await this.textAnalysisService.analyzeEmail(query.title, query.text);
    }
}
