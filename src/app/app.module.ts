import { BrowserModule } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ScrumboardComponent } from './scrumboard/scrumboard.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { SupportComponent } from './support/support.component';
import { DataService } from './data.service';
import { TermsComponent } from './terms/terms.component';
import { HomeComponent } from './home/home.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { MentionModule } from 'angular-mentions';


@NgModule({
  declarations: [
    AppComponent,
    ScrumboardComponent,
    LoginComponent,
    SignupComponent,
    SupportComponent,
    TermsComponent,
    HomeComponent,
    
    
  ],
  
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
    MentionModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    DataService,
    WebsocketService
  
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }