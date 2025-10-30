import { Injectable, inject } from '@angular/core';
import { BehaviorSubject , shareReplay, Observable, of} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from 'src/app/shared/models/user';
import { catchError } from 'rxjs/operators';

const API_BASE_URL = '/api/user';
@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private http = inject(HttpClient);
  private userDataSubject = new BehaviorSubject<User|null>({});
  userData$ = this.userDataSubject.asObservable().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
  );

  setUserData(userData: User): void {
    this.userDataSubject.next(userData);
  }

  getUserData(): User | null{
    return this.userDataSubject.getValue();
  }

  updateUserData(userData: Partial<User>): void {
    const currentData = this.userDataSubject.getValue();
    const updatedData = { ...currentData, ...userData };
    this.userDataSubject.next(updatedData);
  }

  removeUserData():void{
    this.userDataSubject.next(null);
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
    
}