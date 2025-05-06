import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private http: HttpClient
  ) { }

  public getUser() {
    return this.http.get(env.apiUrl + '/api/user/id');
  }
  public updateUser(data: any) {
    return this.http.post(env.apiUrl + '/api/client-update', data);
  }

  public getInvoice(data: any) {
    return this.http.post(env.apiUrl + '/api/client/invoices', data);
  }

  public exportData(data) {
    return this.http.post(env.apiUrl + '/api/client/invoices-export',{invoices: data},{responseType:'blob'});
  }
  public invoicesCount() {
    return this.http.get(env.apiUrl + '/api/client/invoices-count');
  }
}  