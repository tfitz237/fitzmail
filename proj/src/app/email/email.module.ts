import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailListComponent } from './email-list/email-list.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { SafePipe } from './safe.pipe';
export const EmailRoutingModule = RouterModule.forChild([
  {
    path: '', component: EmailListComponent
  }
]);

@NgModule({
  declarations: [EmailListComponent, SafePipe],
  imports: [
    HttpClientModule,
    CommonModule,
    FormsModule,
    EmailRoutingModule,
    MatListModule,
    MatIconModule,
    MatCheckboxModule
  ]
})
export class EmailModule { }
