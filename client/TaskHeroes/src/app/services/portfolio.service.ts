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

  // 1. Use this for Profiles & Portfolios
  uploadTempImage(file: File, folderName: string): Observable<{ url: string, public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folderName);
    return this.http.post<{ url: string, public_id: string }>(`${this.apiUrl}/upload/temp`, formData);
  }

  // 2. Use this for Chatroom Attachments!
  uploadDirectFile(file: File, folderName: string): Observable<{ url: string, public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folderName);
    return this.http.post<{ url: string, public_id: string }>(`${this.apiUrl}/upload/direct`, formData);
  }
  
  // 3. Delete (Now supports resource_type for PDFs)
  deleteImage(publicId: string, resourceType: 'image' | 'raw' = 'image'): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete`, { 
        body: { public_id: publicId, resource_type: resourceType } 
    });
  }
}