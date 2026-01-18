import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly apiUrl = 'http://localhost:3000/api/portfolio';

  constructor(private http: HttpClient) {}

  uploadImage(file: File, folderName: string): Observable<{ url: string, public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folderName); // This matches req.body.folder on the backend

    return this.http.post<{ url: string, public_id: string }>(`${this.apiUrl}/upload`, formData);
  }

  deleteImage(publicId: string): Observable<any> {
    // Using request body for DELETE to pass the public_id
    return this.http.delete(`${this.apiUrl}/delete`, { 
        body: { public_id: publicId } 
    });
  }
}