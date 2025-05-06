import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { LocalStorageService } from '../services/localstorage.service';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(
    private router: Router,
    private AuthApi: AuthService,
    private toastr: ToastrService,
    private localStorage: LocalStorageService,
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    if (this.AuthApi.isAuthenticated()) {
      request = this.addToken(request, this.AuthApi.getJwtToken());
    }

    request = request.clone({
      withCredentials: true,
    });

    return next.handle(request).pipe(catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401)
        return this.handle401Error(request, next);
      else {
        this.showAlertErrorMessage(error);
        return throwError(() => error);
      }
    }))
  }

  private addToken(request:any, token: any) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(request:any, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      const token = this.AuthApi.getJwtToken();
      if (token)
        return this.AuthApi.refreshToken(token).pipe(
          switchMap((res: any) => {
            this.isRefreshing = false;
            this.AuthApi.storeTokens(res);
            this.refreshTokenSubject.next(res.access_token);
            
            return next.handle(this.addToken(request, res.access_token));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            
            this.AuthApi.logout();
            return throwError(err);
          })
        );
    }
    return this.refreshTokenSubject.pipe(
      filter((token:any) => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addToken(request, token)))
    );
  }

  private showAlertErrorMessage(error:any){
    if(error.error.error && error.error.message){
      var curLang = this.localStorage.getItem('curLang');
      this.toastr.error(error.error.message[curLang]);
    }
  }

}