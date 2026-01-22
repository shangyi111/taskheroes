import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/auth/login/login.component';
import {AuthGuard} from 'src/app/auth/auth.guard';
import { SearchComponent } from 'src/app/seeker/search/search.component';
import { RegistrationComponent } from 'src/app/auth/register/register.component';
import {DashboardComponent} from 'src/app/shared/ui-components/dashboard/dashboard.component';
import {JobOrdersComponent} from './provider/joborders/job_orders.component';
import { ChatroomComponent } from './shared/ui-components/messenger/components/chatroom/chatroom.component';
import { BusinessPageComponent } from 'src/app/provider/business_page/business_page.component';
import { ChatroomsComponent } from './shared/ui-components/messenger/components/chatrooms/chatrooms.component';
import { OrdersComponent } from './seeker/orders/orders.component';
import { ManageServiceComponent } from './provider/manage_service/manage_service.component';
import { ServiceDetailsComponent } from './seeker/service-details/service-details.component';
import { MessengerLayoutComponent } from './shared/ui-components/messenger/messenger-layout/messenger-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'search', component: SearchComponent },
  {
    path: 'messenger',
    component: MessengerLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: ':chatroomId', 
        component: ChatroomComponent,
        runGuardsAndResolvers: 'paramsChange'
      }
    ]
  },
   // Role: PROVIDER Context
  {
    path: 'provider/:userId',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: BusinessPageComponent },
      { path: 'jobs', component: JobOrdersComponent },
      { path: 'chatrooms', redirectTo: '/messenger', pathMatch: 'full' },
      { path: 'manage/:serviceId', component: ManageServiceComponent }
    ]
  },
   // Role: SEEKER Context
  {
    path: 'seeker/:userId',
    canActivate: [AuthGuard],
    children: [
      { path: 'orders', component: OrdersComponent },
      { path: 'chatrooms', redirectTo: '/messenger', pathMatch: 'full' },
    ]
  },
  {
    path: 'service/:serviceId',
    component: ServiceDetailsComponent,
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