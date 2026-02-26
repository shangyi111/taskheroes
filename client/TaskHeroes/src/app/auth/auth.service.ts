import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap,map } from 'rxjs/operators';
import { User } from 'src/app/shared/models/user';
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
    const token = this.getToken();
    if (!token) return false;

    const currentUserId = this.userDataService.getUserData()?.id;

    // If we have a token but NO ID in memory (The "NG-SERVE Refresh" state)
    if (token && !currentUserId) {
      try {
        // 1. Sync extraction of ID to prevent immediate crashes
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userId = decoded.id; 

        // 2. Immediate partial hydration so Guards pass
        this.userDataService.setUserData({ id: userId } as User);

        // 3. Background full hydration
        this.userDataService.fetchAndSyncProfile(userId).subscribe();
        
      } catch (e) {
        console.error('Token decoding failed', e);
        this.logout();
        return false;
      }
    }

    return true;
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