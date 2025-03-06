import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardPageComponent } from './card-page/card-page.component';
import { BrowserModule } from '@angular/platform-browser';
import { CardStandaloneComponent } from './card-standalone.component';
import { RegisterComponent } from './component/register/register.component';
import { LoginComponent } from './component/login/login.component';
import { AboutComponent } from './component/about/about.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent},
  { path: 'login', component: LoginComponent },
  { path: 'cards', component: CardPageComponent },
  { path: 'about', component: AboutComponent },
  { path: '', pathMatch: 'full', redirectTo: '/list' },
  { path: 'list', component: CardStandaloneComponent }
];


export class AppRoutingModule { }
