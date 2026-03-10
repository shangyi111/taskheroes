import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// If you have an environment file, import it to use your API URL:
// import { environment } from '../../../environments/environment';

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root' // This makes the service available everywhere in your app
})
export class ContactService {
  private http = inject(HttpClient);
  
  // Replace this with environment.apiUrl + '/contact' if you use environment files
  private apiUrl = 'http://localhost:3000/api/contact';

  sendMessage(data: ContactFormPayload): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}