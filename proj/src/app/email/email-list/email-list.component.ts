import { Component, OnInit } from '@angular/core';
import { ImapService } from '../imap.service';

@Component({
  selector: 'app-email-list',
  templateUrl: './email-list.component.html',
  styleUrls: ['./email-list.component.sass']
})
export class EmailListComponent implements OnInit {
  emails: any[];
  constructor(private imap: ImapService) { }

  ngOnInit() {
    this.imap.getEmail().subscribe(x => this.emails = x);
  }

}
