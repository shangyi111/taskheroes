import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/auth/login/login.component';
import {AuthGuard} from 'src/app/auth/auth.guard';
import { SearchComponent } from 'src/app/seeker/search/search.component';
import { RegistrationComponent } from 'src/app/auth/register/register.component';
import {DashboardComponent} from 'src/app/ui-components/dashboard/dashboard.component';
import { RequestComponent } from './seeker/request/request.component';
import {JobOrdersComponent} from './provider/joborders/job_orders.component';
// import { SearchResultsComponent } from './seeker/search/search-results/search-results.component';
// import { MessagesComponent as SeekerMessagesComponent } from './seeker/messages/messages.component';
// import { ProfileComponent as SeekerProfileComponent } from './seeker/profile/profile.component';
import { BusinessPageComponent } from 'src/app/provider/business_page/business_page.component';
import { ChatroomsComponent } from './provider/messenger/chatrooms/chatrooms.component';
// import { ProfileComponent as ProviderProfileComponent } from './provider/profile/profile.component';
// import { MessagesComponent as ProviderMessagesComponent } from './provider/messages/messages.component';

export const routes: Routes = [
//   { path: '', redirectTo: '/search', pathMatch: 'full' }, // Default route
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
    path: 'user/:userId/jobs',
    component: JobOrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'provider/:providerId/chatrooms',
    component: ChatroomsComponent,
    canActivate: [AuthGuard],
  },
  // {
  //   path: 'service/:serviceId',
  //   component: BusinessDetailComponent,
  //   canActivate: [AuthGuard],
  // },
  { path: 'register', component: RegistrationComponent }, 
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect to login by default
  { path: '**', redirectTo: '/login' }, // Redirect any other unknown routes to login
//   { path: 'search', component: SearchComponent },
//   { path: 'search-results', component: SearchResultsComponent },
//   { path: 'seeker-messages', component: SeekerMessagesComponent },
//   { path: 'seeker-profile', component: SeekerProfileComponent },
//   { path: 'business-page', component: BusinessPageComponent },
//   { path: 'provider-profile', component: ProviderProfileComponent },
//   { path: 'provider-messages', component: ProviderMessagesComponent },
  // ... other routes
];