import { Injectable } from '@nestjs/common';
import ImapClient from 'emailjs-imap-client';
import * as utf8 from 'utf8';
import { ConfigService } from '../shared/config.service';
@Injectable()
export class ImapService {
  client: any;
  connected: boolean = false;
  messages: [];
  constructor(private readonly configService: ConfigService) {
    this.connect();
  }

  async connect(): Promise<boolean> {
    if (this.connected) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>(async (resolve, reject) => {
      this.client = new ImapClient(
        this.configService.config.gmail.host,
        this.configService.config.gmail.port,
        {
          auth: {
            user: this.configService.config.gmail.user,
            pass: this.configService.config.gmail.pass,
          },
          useSecureTransport: true,
        },
      );
      this.client
        .connect()
        .then(() => {
          this.connected = true;
          resolve(true);
        })
        .catch(reject);
    });
  }

  async readyInbox() {
    return new Promise<any>((resolve, reject) => {
      this.client
        .listMailboxes()
        .then(resolve)
        .catch(reject);
    });
  }

  async getEmails(config?: EmailGetConfig) {
    if (!this.client) {
      await this.connect();
    }
    return new Promise<string[]>(async (resolve, reject) => {
      let data = await this.client.listMessages(
        'INBOX',
        `${config ? config.start : 1}:${config ? config.end : 10}`,
        ['uid', 'flags', 'envelope', 'bodystructure'],
      );
      data = config && config.withBody ? await this.parseMessages(data) : data;
      resolve(data);
    });
  }

  async getEmailBody(config: EmailGetConfig) {
    let data = await this.client.listMessages(
      'INBOX',
      config.uid,
      ['uid', 'flags', 'envelope', 'bodystructure'],
      {byUid: true}
    );
    data = data[0];
    data = await this.parseBody(data);
    return data.body[0];
  }

  async parseMessages(messages: any[]) {
    return new Promise<any>(async (resolve, reject) => {
      for (var i = 0; i < messages.length; i++) {
        const message = messages[i];
        messages[i] = await this.parseBody(message);
      }
      resolve(messages);
    });
  }

  async parseBody(message: any) {
    return new Promise<string>(async (resolve, reject) => {
      const parts = this.findPartsWithText(message);
      if (parts && parts.length > 0) {
        const msg = await this.client.listMessages(
          'INBOX',
          message.uid,
          ['uid', ...parts],
          { byUid: true },
        );
        message.body = [];
        parts.forEach(x => (message.body.push(this.parseText(msg[0][x]))));
        resolve(message);
      } else {
        resolve(message);
      }
    });
  }

  parseText(text: string) {
    const replacements = {
      '=': /=3D/g,
      '': [/=\r\n/g, /\r\n/g, /<!--\t-->/g],     
      "'": [/=E2=80=9C/g, /=E2=80=9D/g, /=E2=80=99/g, /&#39;/g],
      ' ': [/&nbsp;/g, /=C2=A0/g, /%20/g],
    };
    Object.keys(replacements).forEach(x => {
      if (Array.isArray(replacements[x])) {
        replacements[x].forEach(y => {
          text = text.replace(y, x);
        });
      } else {
        text = text = text.replace(replacements[x], x);
      }
    });
    return text;
  }

  findPartsWithText(message: any) {
    const rtn = [];
    let nodes = message.bodystructure.childNodes;
    if (message.bodystructure.type.includes('text/html')) {
      rtn.push(`body[1]`);
    }

    if (Array.isArray(nodes)) {    
      this.flatten(nodes)
          .filter(node => node.type.includes('text/html'))
          .forEach(node => rtn.push(`body[${node.part}]`))
    }
    return rtn;

  }

  flatten(arr) {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(
        Array.isArray(toFlatten.childNodes)
          ? this.flatten(toFlatten.childNodes)
          : toFlatten,
      );
    }, []);
  }
}

export interface Email {
  from: string;
  to: string;
  subject: string;
  date: string;
}

export interface EmailGetConfig {
  uid?: string;
  from?: string;
  to?: string;
  start?: number;
  end?: number;
  withBody?: boolean;
}
