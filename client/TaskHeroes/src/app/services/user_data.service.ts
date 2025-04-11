import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {User} from 'src/app/shared/models/user';
import { shareReplay } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private userDataSubject = new BehaviorSubject<User|null>({});
  userData$ = this.userDataSubject.asObservable().pipe(shareReplay(1));

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