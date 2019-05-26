export type EmailChain = {
    chain: EmailMessage[];
    subject: string;
    senders: string;
    date: string;
    attachments?: EmailBodyStructure[];
    categories?: string[]
};

export type EmailMessage = {
    '#': number;
    uid: number;
    flags?: string[];
    envelope?: EmailMessageEnvelope;
    bodystructure?: EmailBodyStructure;
    body?: string[];
    flag: EmailFlags;
    attachments?: EmailBodyStructure[];
};

export type EmailFlags = {
    answered: boolean;
    unread: boolean;
    starred: boolean;
    hasAttachment: boolean;
}

export type EmailMessageEnvelope = {
    date: string;
    subject: string;
    from: EmailContact[];
    to: EmailContact[];
    sender: EmailContact[];
    cc?: EmailContact[];
    'reply-to'?: EmailContact[];
    'message-id': string;
    'in-reply-to'?: string;
}

export type EmailContact = {
    address: string;
    name: string;
}

export type EmailBodyStructure = {
    type: string;
    encoding: string;    
    parameters: EmailBodyStructureParameters;
    id?: string;
    part?: string;   
    size?: number;
    lineCount?: number;
    disposition?: string;
    dispositionParameters?: EmailBodyStructureParameters;
    childNodes?: EmailBodyStructure[];
    selector: string;
}

export type EmailBodyStructureParameters = {
    charset?: string;
    filename?: string;
    boundary?: string;
}
