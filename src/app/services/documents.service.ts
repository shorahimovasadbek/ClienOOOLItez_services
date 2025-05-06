import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {

  constructor(
    private http: HttpClient
  ) { }

  getDocuments(data) {
    return this.http.post(`${env.apiUrl}/api/client/documents`,data);
  }
  getDocument(data) {
    return this.http.get(`${env.apiUrl}/api/client/document-detail/${data.id}?type=${data.type}`);
  }
  public downloadDocuments(data) {
    return this.http.post(env.apiUrl+'/api/document-download', data, {responseType:'blob'});
  }
}