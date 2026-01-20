import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/auth/login/login.component';
import {AuthGuard} from 'src/app/auth/auth.guard';
import { SearchComponent } from 'src/app/seeker/search/search.component';
import { RegistrationComponent } from 'src/app/auth/register/register.component';
import {DashboardComponent} from 'src/app/shared/ui-components/dashboard/dashboard.component';
import {JobOrdersComponent} from './provider/joborders/job_orders.component';
import { ChatroomComponent } from './shared/ui-components/messenger/chatroom/chatroom.component';
import { BusinessPageComponent } from 'src/app/provider/business_page/business_page.component';
import { ChatroomsComponent } from './shared/ui-components/messenger/chatrooms/chatrooms.component';
import { OrdersComponent } from './seeker/orders/orders.component';
import { ManageServiceComponent } from './provider/manage_service/manage_service.component';
import { ServiceDetailsComponent } from './seeker/service-details/service-details.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'search', component: SearchComponent },
   // Role: PROVIDER Context
  {
    path: 'provider/:userId',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: BusinessPageComponent },
      { path: 'jobs', component: JobOrdersComponent },
      { path: 'chatrooms', component: ChatroomsComponent },
      { path: 'manage/:serviceId', component: ManageServiceComponent }
    ]
  },
   // Role: SEEKER Context
  {
    path: 'seeker/:userId',
    canActivate: [AuthGuard],
    children: [
      { path: 'orders', component: OrdersComponent },
      { path: 'chatrooms', component: ChatroomsComponent },
    ]
  },
  {
    path: 'service/:serviceId',
    component: ServiceDetailsComponent,
    canActivate: [AuthGuard],
  },
  { 
    path: 'chatroom/:chatroomId', 
    component: ChatroomComponent, 
    canActivate: [AuthGuard] 
  },
  {
    path: 'user/:userId/provider/manage/:serviceId',
    component: ManageServiceComponent,
    canActivate: [AuthGuard],
  },
  // Fallbacks
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: '**', redirectTo: '/search' }
];