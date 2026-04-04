import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject , shareReplay, Observable, of, tap} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from 'src/app/shared/models/user';
import { catchError } from 'rxjs/operators';
import { AUTH_TOKEN_KEY } from '../shared/constants';

const API_BASE_URL = 'http://localhost:3000/api/user';
@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private readonly GUEST_USER: User = {
    id: undefined,
    role: 'seeker',
    username: 'Guest'
  };

  private readonly PREFERRED_ROLE_KEY = 'preferred_role';

  // 2. Create the Role Subject & Signal (Add this below your userSignal)
  private userRoleSubject = new BehaviorSubject<string>(
    localStorage.getItem(this.PREFERRED_ROLE_KEY) || 'seeker'
  );
  
  userRole$ = this.userRoleSubject.asObservable().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  userRoleSignal = toSignal(this.userRole$, { 
    initialValue: localStorage.getItem(this.PREFERRED_ROLE_KEY) || 'seeker' 
  });

  // 3. Add this method so your toggle buttons can switch the role globally
  setUserRole(role: 'seeker' | 'provider'): void {
    localStorage.setItem(this.PREFERRED_ROLE_KEY, role);
    this.userRoleSubject.next(role);
  }

  private http = inject(HttpClient);
  private userDataSubject = new BehaviorSubject<User|null>(this.GUEST_USER);
  userData$ = this.userDataSubject.asObservable();
  userSignal = toSignal(this.userData$, { initialValue: this.GUEST_USER });

  constructor() {
    // THE FIX: Wake up and hydrate using ONLY the token!
    this.hydrateFromToken();
  }

  private hydrateFromToken(): void {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    try {
      // 1. Decode the token payload securely (without needing a backend call just yet)
      const decodedPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = decodedPayload.id;

      if (userId) {
        // 2. Fetch the fresh, secure profile from the backend
        this.fetchAndSyncProfile(userId).subscribe();
      }
    } catch (e) {
      console.error('Failed to decode token on startup', e);
      this.removeUserData(); // Clear bad tokens
    }
  }

  setUserData(userData: User): void {
    this.userDataSubject.next(userData);
  }

  getUserData(): User | null{
    const user = this.userDataSubject.getValue();
    return user || this.GUEST_USER;
  }

  updateUserData(userData: Partial<User>): void {
    const currentData = this.userDataSubject.getValue();
    const updatedData = { ...currentData, ...userData };
    this.userDataSubject.next(updatedData);
  }

  removeUserData():void{
    this.userDataSubject.next(this.GUEST_USER);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /**
   * Fetches a specific user profile by ID.
   * This method is asynchronous and returns an Observable.
   * @param id The ID of the user to fetch.
   * @returns An Observable of User or null.
   */
  getUserById(id: string): Observable<User | null> {
    if (!id) {
        // Immediately return null if the ID is invalid/missing
        return of(null);
    }
    
    // Construct the API endpoint URL
    const url = `${API_BASE_URL}/${id}`; 

    return this.http.get<User>(url).pipe(
        // Use catchError to handle HTTP errors (e.g., 404 Not Found, 500 Server Error)
        catchError(err => {
            console.error(`Failed to fetch user profile for ID: ${id}`, err);
            // Return an Observable of null so the stream doesn't break
            return of(null); 
        })
    );
  }

  /**
   * Orchestrator: Fetches the full profile and updates the app state.
   * Uses the "dumb" getUserById helper internally.
   */
  fetchAndSyncProfile(userId: string): Observable<User | null> {
    return this.getUserById(userId).pipe(
      tap(fullUser => {
        if (fullUser) {
          this.setUserData(fullUser);
          console.log('UserDataService: State re-hydrated with full profile.');
        }
      })
    );
  }

  /**
   * Fetches multiple user profiles in a single request.
   * @param ids Array of user IDs to fetch.
   */
  getUsersBatch(ids: (string | number)[]): Observable<User[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    return this.http.post<User[]>(`${API_BASE_URL}/batch`, { ids }).pipe(
      catchError(err => {
        console.error('Failed to fetch batch users', err);
        return of([]); // Return empty array on failure
      })
    );
  }

   /**
   * Fetches multiple user profiles in a single request.
   * @param ids Array of user IDs to fetch.
   */
  getUsersPublicBatch(ids: (string | number)[]): Observable<User[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    return this.http.post<User[]>(`${API_BASE_URL}/publicbatch`, { ids }).pipe(
      catchError(err => {
        console.error('Failed to fetch batch users', err);
        return of([]); // Return empty array on failure
      })
    );
  }

  /**
   * Updates the core profile and user details
   */
  updateUserProfile(profileData: any): Observable<any> {
    // Hits the exports.updateMe route you set up in your backend
    return this.http.put(`${API_BASE_URL}/me`, profileData).pipe(
      tap((response: any) => {
        // If the backend returns the updated user, sync it to the frontend state
        if (response && response.user) {
          this.updateUserData({
            username: response.user.username,
            email: response.user.email,
            profile: response.profile // The new UserProfile data
          });
        }
      }),
      catchError(err => {
        console.error('Failed to update profile', err);
        throw err;
      })
    );
  }

  /**
   * Updates account security (Password)
   * Note: You will need to create a specific backend route (e.g., PUT /api/user/me/security)
   * in your userController.js to handle bcrypt password hashing securely.
   */
  updateUserSecurity(securityData: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/me/security`, securityData).pipe(
      catchError(err => {
        console.error('Failed to update security settings', err);
        throw err;
      })
    );
  }
      
}