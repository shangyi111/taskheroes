import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap,map } from 'rxjs/operators';
import {User} from 'src/app/shared/models/user';
import { UserDataService } from '../services/user_data.service';

interface LoginResponse {
  token: string;
  user:User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USER_KEY = 'user';
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly API_URL = 'http://localhost:3000/api'; // Replace with your backend API URL
  private http = inject(HttpClient);
  private userDataService = inject(UserDataService);

  login(credentials:User): Observable<User> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((response: LoginResponse) => {
        this.setToken(response.token);
        this.setUser(response.user);
      }),
      map((response)=> response.user)
    );
  }

  register(userData: User): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/auth/signup`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userDataService.removeUserData();
    // Optionally redirect the user to the login page or a public route
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
  }
  
  setUser(user:User):void{
    localStorage.setItem(this.USER_KEY,JSON.stringify(user));
  }
}