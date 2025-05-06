import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ColleaguesService {

  constructor(
    private http: HttpClient
  ) { }

  getColleagues(data): Observable<any> {
    return this.http.get<any>(`${env.apiUrl}/api/client/employee?name=${data.name || ''}&status=${data.status}`);
  }
  getColleague(id) {
    return this.http.get(`${env.apiUrl}/api/client/employee/${id}`);
  }
  postColleague(data) {
    return this.http.post(`${env.apiUrl}/api/client/employee`, data);
  }
  putColleague(data) {
    return this.http.put(`${env.apiUrl}/api/client/employee/${data.id}`, data);
  }
  deleteColleague(id) {
    return this.http.delete(`${env.apiUrl}/api/client/employee/${id}`);
  }
}