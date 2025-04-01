import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {User} from 'src/app/shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private userDataSubject = new BehaviorSubject<User|null>({});
  userData$ = this.userDataSubject.asObservable();

  setUserData(userData: User): void {
    this.userDataSubject.next(userData);
  }

  getUserData(): User | null{
    return this.userDataSubject.getValue();
  }

  updateUserData(userData: Partial<User>): void {
    console.log("inside updateuserdata");
    const currentData = this.userDataSubject.getValue();
    const updatedData = { ...currentData, ...userData };
    console.log("updateData", updatedData);
    this.userDataSubject.next(updatedData);
  }

  removeUserData():void{
    this.userDataSubject.next(null);
  }
}