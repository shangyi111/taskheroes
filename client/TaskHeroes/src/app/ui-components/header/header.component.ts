import { Router,RouterLink, ActivatedRoute, NavigationEnd,UrlSegment,RouterModule} from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service'; 
import { Component, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Observable } from 'rxjs';
import { Segment } from 'next/dist/server/app-render/types';
import{filter,map} from 'rxjs/operators';
import { UserDataService } from 'src/app/services/user_data.service';
import {User} from 'src/app/shared/models/user'
;

@Pipe({
  name: 'userRolePipe',
  standalone: true
})
export class UserRolePipe implements PipeTransform {
  transform(url: string|null): 'seeker' | 'provider'| undefined  {
    if(url){
      const userRouteRegex = /^\/user\/[^\/]+\/(seeker|provider)$/;
      if (userRouteRegex.test(url)) {
        const parts = url.split('/');
        const role = parts[3];
        if (role === 'seeker' || role === 'provider') {
          return role;  
        }
      }
    }
    return undefined;
  }
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink,CommonModule,RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly userData$ : Observable<User | null>= inject(UserDataService).userData$;
  readonly routeUrl$ =this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.url)
  );
  protected readonly userId = inject(ActivatedRoute).snapshot.paramMap.get('userId');

  ngOnInit(){
    this.userData$.subscribe((user)=>{
      console.log("testing userData",user);
    })
  }
  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}