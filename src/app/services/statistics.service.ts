import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { env } from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {

    constructor(
        private http: HttpClient
    ) { }

    public getAll(data) {
        return this.http.post(env.apiUrl + '/api/client/statistics', data);
    }
    public getInvoicesStat(data, endpoint) {
        return this.http.post(env.apiUrl + `/api/client/statistics-${endpoint}`,data);
    }

    public statisticsPdf(data) {
        return this.http.post(env.apiUrl+'/api/statistics/companies', data, {responseType: 'arraybuffer'});
      }
}