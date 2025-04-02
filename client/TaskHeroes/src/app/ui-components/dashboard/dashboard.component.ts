import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserDataService } from 'src/app/services/user_data.service';
import {User} from 'src/app/shared/models/user';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html', 
  styleUrls: ['./dashboard.component.scss'],
  imports: [MatCardModule, MatButtonModule], // Import the required modules, including Router
})
export class DashboardComponent {
  private userDataService = inject(UserDataService);
  private router = inject(Router);
  protected readonly userId = inject(ActivatedRoute).snapshot.paramMap.get('userId');

  clickCard(role:string){
    const user:User={
      role,
    }
    this.userDataService.updateUserData(user);
    this.router.navigate(["user",this.userId,role]);
  }
}