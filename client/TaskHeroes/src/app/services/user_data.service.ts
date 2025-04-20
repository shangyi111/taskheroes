import { Injectable } from '@angular/core';
import { BehaviorSubject , shareReplay} from 'rxjs';
import {User} from 'src/app/shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
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
}