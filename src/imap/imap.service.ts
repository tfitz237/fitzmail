import { Injectable } from '@nestjs/common';
import ImapClient from 'emailjs-imap-client';
import { ConfigService } from '../shared/config.service';
import { EmailMessage, EmailFlags, EmailBodyStructure, EmailChain } from './imap.models';
@Injectable()
export class ImapService {
  client: any;
  connected: boolean = false;
  messages: [];
  constructor(private readonly configService: ConfigService) {
    this.connect();
  }

  async connect() {
    if (this.connected) {
      return;
    }
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
    try {
      await this.client.connect();
      this.connected = true;
    } catch (e) {
      this.connected = false;
    }
  }

  async readyInbox() {
    try {
      return this.client.listMailboxes();
    } catch (e) {
      throw e;
    }
  }

  async getEmails(config?: EmailGetConfig): Promise<EmailMessage[][]> {
    if (!this.client) {
      await this.connect();
    }
    let data = await this.client.listMessages(
      'INBOX',
      `${config ? config.start : 1}:${config ? config.end : 10}`,
      ['uid', 'flags', 'envelope', 'bodystructure'],
    );
    data = await this.parseMessages(data, config && config.withBody);
    const chains = this.findEmailChains(data);
    return chains;
  }

  findEmailChains(messages: EmailMessage[]): EmailMessage[][] {
    let chains: EmailMessage[][] = [];
    for(let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const chainIndex = chains.findIndex(x => 
        x ? !!x.find(y => 
                     y.envelope["in-reply-to"] === message.envelope["message-id"] || 
                     y.envelope["message-id"] === message.envelope["in-reply-to"]) 
          : false
      );
      const filteredMessages = messages.filter(y => 
                     y.envelope["in-reply-to"] === message.envelope["message-id"] || 
                     y.envelope["message-id"] === message.envelope["in-reply-to"]);
      if (chainIndex !== -1) {
        if (!filteredMessages.find(x => x.envelope["message-id"] == message.envelope["message-id"])) {
          chains[chainIndex].push(message);
        }
      } else {
        chains.push([...filteredMessages, message]);
      }
    }
    chains = chains.map(chain => {
      let c: EmailMessage[] = [];
      chain.forEach(x => {
        if (!c.find(y => y.uid === x.uid)) {
          c.push(x);
        }
      })
      chain = c.sort((a, b) => b["#"] - a["#"]);
      return chain;
    });
    return chains;
  }
  
  async getEmailBody(config: EmailGetConfig): Promise<string> {
    let data = await this.client.listMessages(
      'INBOX',
      config.uid,
      ['uid', 'flags', 'envelope', 'bodystructure'],
      {byUid: true}
    );
    data = data[0];
    data = await this.retrieveBody(data);
    return data.body[0];
  }

  async parseMessages(messages: EmailMessage[], withBody: boolean): Promise<EmailMessage[]> {
    for (var i = 0; i < messages.length; i++) {
      let message = messages[i];
      message = this.parseFlags(message);
      if (withBody) {
        message = await this.retrieveBody(message);
      }
    }
    return messages;
  }

  async retrieveBody(message: EmailMessage) {
    const parts = this.findPartsWithType(message);
    if (parts && parts.length > 0) {
      const msg = await this.client.listMessages(
        'INBOX',
        message.uid,
        ['uid', ...parts],
        { byUid: true },
      );
      message.body = [];
      parts.forEach(x => (message.body.push(this.parseText(msg[0][x]))));  
    }
    return message;
  }

  parseFlags(message: EmailMessage): EmailMessage {
    const flags = message.flags;
    const attachments = message.bodystructure.childNodes 
                        ? this.flatten(message.bodystructure.childNodes).filter(x => !!x.disposition) 
                        : [];
    message.flag = { 
      unread: !flags.find(x => x.toLowerCase().includes('seen')),
      starred: !!flags.find(x => x.toLowerCase().includes('flagged')),
      answered: !!flags.find(x => x.toLowerCase().includes('answered')),
      hasAttachment: attachments.length > 0
    };

    return message;
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

  findPartsWithType(message: EmailMessage, type: string = 'text/html') {
    const rtn = [];
    let nodes = message.bodystructure.childNodes;
    if (message.bodystructure.type.includes(type)) {
      rtn.push(`body[1]`);
    }

    if (Array.isArray(nodes)) {    
      this.flatten(nodes)
          .filter(node => node.type.includes(type))
          .forEach(node => rtn.push(`body[${node.part}]`))
    }
    return rtn;
  }

  flatten(arr: EmailBodyStructure[]): EmailBodyStructure[] {
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
