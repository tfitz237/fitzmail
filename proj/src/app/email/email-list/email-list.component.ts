import { Component, OnInit } from '@angular/core';
import { ImapService } from '../imap.service';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';

@Component({
  selector: 'app-email-list',
  templateUrl: './email-list.component.html',
  styleUrls: ['./email-list.component.sass']
})
export class EmailListComponent implements OnInit {
  emails: any[];
  selectedEmail: any;
  constructor(private imap: ImapService, private sanitizer:DomSanitizer) { }

  ngOnInit() {
    this.imap.getEmail().subscribe(x => this.emails = x);
  }

  viewEmail(email: any) {
    this.selectedEmail = email;
  }

  getEmailUrl() {
    return `http://localhost:3000/api/email/${this.selectedEmail.chain[0].uid}`;      
  }

}
