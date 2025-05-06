import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { env } from "../../environments/environment";
import { map, tap, catchError } from "rxjs/operators";
import { Router } from "@angular/router";
import { LocalStorageService } from '../services/localstorage.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: "root",
})
export class AuthService {
  readonly baseUrl;
  private readonly JWT_TOKEN = "JWT_TOKEN";

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private localStorage: LocalStorageService,
  ) {
    this.baseUrl = env.apiUrl;
  }

  login(data: any) {
    return this.httpClient.post<any>(`${this.baseUrl}/api/auth/login/client`, data).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      map((res) => {
        return res;
      }),
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  signup(data: any): Observable<boolean> {
    return this.httpClient.post<any>(`${this.baseUrl}/api/auth/signup/client`, data).pipe(
      map((res) => {
        return res;
      }),
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  refreshToken(token: any) {
    return this.httpClient.post(this.baseUrl + '/api/auth/refresh-token', {
      access_token: token
    }, httpOptions);
  }

  isAuthenticated() {
    return !!this.getJwtToken();
  }

  getJwtToken() {
    return this.localStorage.getItem(this.JWT_TOKEN);
  }

  logout() {
    this.logoutClient();
    this.removeTokens();
    this.router.navigate(["/"]);
  }

  private storeJwtToken(jwt: string) {
    this.localStorage.setItem(this.JWT_TOKEN, jwt);
  }

  storeTokens(tokens: any) {
    this.localStorage.setItem(this.JWT_TOKEN, tokens.access_token);
  }

  removeTokens() {
    this.localStorage.removeItem(this.JWT_TOKEN);
    this.localStorage.removeItem('SD');
    this.localStorage.removeItem('columns');
  }

  logoutClient() {
    return this.httpClient.get(`${this.baseUrl}/api/logout-client`).subscribe((res: any) => { })
  }
}