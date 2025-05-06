import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  constructor(
    private http: HttpClient
  ) { }

  getFinance(data) {
    return this.http.post(`${env.apiUrl}/api/client/finances`,data);
  }
  getFinanceSum() {
    return this.http.get(`${env.apiUrl}/api/client/finances-summ`);
  }
  public exportData(data) {
    return this.http.post(env.apiUrl + '/api/client/finances-export',{finances: data},{responseType:'blob'});
  }
}