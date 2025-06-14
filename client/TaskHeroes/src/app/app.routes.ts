import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/auth/login/login.component';
import {AuthGuard} from 'src/app/auth/auth.guard';
import { SearchComponent } from 'src/app/seeker/search/search.component';
import { RegistrationComponent } from 'src/app/auth/register/register.component';
import {DashboardComponent} from 'src/app/shared/ui-components/dashboard/dashboard.component';
import { RequestComponent } from './seeker/request/request.component';
import {JobOrdersComponent} from './provider/joborders/job_orders.component';
import { ChatroomComponent } from './shared/ui-components/messenger/chatroom/chatroom.component';
import { BusinessPageComponent } from 'src/app/provider/business_page/business_page.component';
import { ChatroomsComponent } from './shared/ui-components/messenger/chatrooms/chatrooms.component';
import { OrdersComponent } from './seeker/orders/orders.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
    { path: 'user/:userId', component: DashboardComponent, canActivate: [AuthGuard],
  }, // User-specific dashboard
  {
    path: 'user/:userId/seeker',
    component: SearchComponent,
    canActivate: [AuthGuard], // Add AuthGuard if needed
  },
  {
    path:'user/:userId/service/:serviceId/request',
    component:RequestComponent,
    canActivate:[AuthGuard],
  },
  {
    path: 'user/:userId/provider',
    component: BusinessPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'user/:userId/provider/jobs',
    component: JobOrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'user/:userId/seeker/orders',
    component: OrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'provider/:providerId/chatrooms',
    component: ChatroomsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'seeker/:seekerId/chatrooms',
    component: ChatroomsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'user/:userId/job/:jobId/chatroom/:chatroomId',
    component: ChatroomComponent,
    canActivate: [AuthGuard],
  },
  { path: 'register', component: RegistrationComponent }, 
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect to login by default
  { path: '**', redirectTo: '/login' }, // Redirect any other unknown routes to login
  // ... other routes
];