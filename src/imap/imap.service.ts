import { Injectable } from '@nestjs/common';
import ImapClient from 'emailjs-imap-client';
import { ConfigService } from '../shared/config.service';
import { EmailMessage, EmailBodyStructure, EmailChain } from './imap.models';
import { TextAnalysisService } from '../text-analysis/text-analysis.service';
@Injectable()
export class ImapService {
  client: any;
  connected: boolean = false;
  messages: [];
  constructor(private readonly configService: ConfigService, private readonly textAnalysisService: TextAnalysisService) {
    this.connect();
  }

  private async connect() {
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

  async getEmails(config: EmailGetConfig = {}): Promise<EmailChain[]> {
    const data = this.parseMessages(await this.retrieveEmails('INBOX', config.start, config.end));
    let chains = this.findEmailChains(data);
    //chains = await this.findCategories(chains);
    return chains;
  }

  async getEmailBody(config: EmailGetConfig): Promise<string> {
    let data = (await this.retrieveEmails('INBOX', config.start, config.end, config.uid))[0];
    data = await this.retrieveBody(data);
    return data.body[0];
  }

  private async retrieveEmails(inbox: string, start: number = 1, end: number = 25, uid: number = -1): Promise<EmailMessage[]> {
    if (!this.client) {
      await this.connect();
    }
    return await this.client.listMessages(
      inbox,
      uid < 0 ? `${start}:${end}` : uid,
      [EmailQueries.uid, EmailQueries.flags, EmailQueries.envelope, EmailQueries.bodyStructure],
      { byUid: uid > -1 }
    );
  }

  private async retrieveBody(message: EmailMessage): Promise<EmailMessage> {
    const parts = this.findPartsWithType(message);
    if (parts && parts.length > 0) {
      const msg = await this.client.listMessages(
        'INBOX',
        message.uid,
        [EmailQueries.uid, ...parts],
        { byUid: true },
      );
      message.body = [];
      parts.forEach(x => (message.body.push(this.parseText(msg[0][x]))));  
    }
    return message;
  }

  private findEmailChains(messages: EmailMessage[]): EmailChain[] {
    let chains: EmailMessage[][] = [];
    for(let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const filterFn = (find, message) => 
        find.envelope["in-reply-to"] === message.envelope["message-id"] || 
        find.envelope["message-id"] === message.envelope["in-reply-to"];
      const chainIndex = chains.findIndex(x => x ? !!x.find((y) => filterFn(y,message)) : false);
      const filteredMessages = messages.filter(y => filterFn(y,message));
      if (chainIndex !== -1) {
        if (!filteredMessages.find(x => x.envelope["message-id"] == message.envelope["message-id"])) {
          chains[chainIndex].push(message);
        }
      } else {
        chains.push([...filteredMessages, message]);
      }
    }
    const rtn = chains.map(c => {
      c = c.filter((x,i) => c.indexOf(x) === i).sort((a, b) => b["#"] - a["#"]);
      
      const senders = c.map(x => x.envelope.sender[0].name + '<' + x.envelope.sender[0].address + '>');
      const chain: EmailChain = {
        subject: c[c.length - 1].envelope.subject,
        date: c[c.length - 1].envelope.date,
        senders: senders.filter((x,i) => senders.indexOf(x) === i).join(', '),
        attachments: [].concat(...c.filter(x => x.attachments).map(x => x.attachments)),
        chain: c
      };
      return chain;
    });
    return rtn;
  }

  private async findCategories(chains: EmailChain[]) {
    for (let i = 0; i < chains.length; i++) {
      const text = await this.retrieveBody(chains[i].chain[0]);
      if (text && text.body && text.body[0]) {
        chains[i].categories = await this.textAnalysisService.analyzeEmail(chains[i].subject, text.body[0]);
      }
      
    }
    return chains;
  }
  private parseMessages(messages: EmailMessage[]): EmailMessage[] {
    for (var i = 0; i < messages.length; i++) {
      let message = messages[i];
      message = this.parseFlags(message);
      if (message.flag.hasAttachment) {
        message.attachments = this.findAttachments(message);
      }
    }
    return messages;
  }

  private parseFlags(message: EmailMessage): EmailMessage {
    const flags = message.flags;
    message.flag = { 
      unread: !flags.find(x => x.toLowerCase().includes('seen')),
      starred: !!flags.find(x => x.toLowerCase().includes('flagged')),
      answered: !!flags.find(x => x.toLowerCase().includes('answered')),
      hasAttachment: message.bodystructure.childNodes && this.flatten(message.bodystructure.childNodes).some(x => !!x.disposition)
    };

    return message;
  }

  private findAttachments(message: EmailMessage): EmailBodyStructure[] {
    return this.flatten(message.bodystructure.childNodes).filter(x => !!x.disposition);
  }

  private parseText(text: string): string {
    Object.keys(emailEncodings).forEach(x => {
      if (Array.isArray(emailEncodings[x])) {
        emailEncodings[x].forEach(y => {
          text = text.replace(y, x);
        });
      } else {
        text = text = text.replace(emailEncodings[x], x);
      }
    });
    return text;
  }

  private findPartsWithType(message: EmailMessage, type: string = 'text/html'): string[] {
    const rtn: string[] = [];
    let nodes = message.bodystructure.childNodes;
    if (message.bodystructure.type.includes(type)) {
      rtn.push(`body[1]`);
    }

    if (Array.isArray(nodes)) {    
      this.flatten(nodes)
          .filter(node => node.type.includes(type))
          .forEach(node => rtn.push(node.selector))
    }
    return rtn;
  }

  private flatten(arr: EmailBodyStructure[]): EmailBodyStructure[] {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(
        Array.isArray(toFlatten.childNodes)
          ? this.flatten(toFlatten.childNodes)
          : toFlatten,
      );
    }, []).map(x => { x.selector = `body[${x.part ? x.part : 1}]`; return x });
  }
}

export const emailEncodings = {
  '=': /=3D/g,
  '': [/=\r\n/g, /\r\n/g, /<!--\t-->/g],     
  "'": [/=E2=80=9C/g, /=E2=80=9D/g, /=E2=80=99/g, /&#39;/g],
  ' ': [/&nbsp;/g, /=C2=A0/g, /%20/g],
};

export const EmailQueries = {
  uid: 'uid',
  flags: 'flags',
  envelope: 'envelope',
  bodyStructure: 'bodystructure'
}

export interface Email {
  from: string;
  to: string;
  subject: string;
  date: string;
}

export interface EmailGetConfig {
  uid?: number;
  from?: string;
  to?: string;
  start?: number;
  end?: number;
  withBody?: boolean;
}

