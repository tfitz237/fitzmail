import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
export class Configuration {
  gmail: {
    host: string;
    port: string;
    user: string;
    pass: string;
  };
}

@Injectable()
export class ConfigService {
  constructor() {}

  _config: Configuration;
  get config() {
    if (this._config) {
      return this._config;
    }
    this._config = JSON.parse(fs.readFileSync('./config.json').toString());
    return this._config;
  }
}
