import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap,map } from 'rxjs/operators';
import {User} from 'src/app/shared/models/user';
import { UserDataService } from '../services/user_data.service';
import { LOCAL_STORAGE_USER_KEY, AUTH_TOKEN_KEY } from 'src/app/shared/constants';

interface LoginResponse {
  token: string;
  user:User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USER_KEY = LOCAL_STORAGE_USER_KEY;
  private readonly AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;
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

  // loginWithGoogle(idToken: string) {
  //   // Send the token to your Node.js backend
  //   return this.http.post(`${this.API_URL}/auth/google`, { idToken });
  // }
  loginWithGoogle(idToken: string): Observable<User> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/google`, { idToken }).pipe(
      tap((response: LoginResponse) => {
        // 🟢 Centralized Side Effects
        this.setToken(response.token);
        this.setUser(response.user);
        this.userDataService.setUserData(response.user);
      }),
      map(response => response.user)
    );
  }
}