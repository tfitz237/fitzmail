import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailListComponent } from './email-list/email-list.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
export const EmailRoutingModule = RouterModule.forChild([
  {
    path: '', component: EmailListComponent
  }
]);

@NgModule({
  declarations: [EmailListComponent],
  imports: [
    HttpClientModule,
    CommonModule,
    EmailRoutingModule,
    MatListModule,
    MatIconModule
  ]
})
export class EmailModule { }
