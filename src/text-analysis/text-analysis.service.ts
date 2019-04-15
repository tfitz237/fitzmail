import { Injectable } from '@nestjs/common';
import Axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class TextAnalysisService {

    async analyzeEmail(title: string, txt: string) {
        try {
        const form = new FormData();
        form.append('key', '5294a524ba82d27ae613131a0a547256');
        form.append('title', title);
        form.append('txt', txt);
        form.append('model', 'IAB_en');
        const response = await Axios.request({
            method: 'post',
            url: 'https://api.meaningcloud.com/class-1.1', 
            data: form, 
            headers: {...form.getHeaders(), 'Content-Type':  'multipart/form-data'} 
        });
        return this.parseCategories(response.data['category_list']);
        } catch (e) {
            console.error(e);
            return e;
        }

    }

    parseCategories(list: any[]) {
        return list.map(x => {
            const labels: any[] = x.label.split('>');
            x.parent = labels[0];
            x.labels = labels.splice(-1, 1);
            delete(x.label);
            return x;
        })
    }

}
