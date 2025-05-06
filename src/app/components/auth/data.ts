import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { env } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { LocalStorageService } from '../../services/localstorage.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'login',
  templateUrl: './login.html',
})
export class LoginComponent implements OnInit {
  constructor(
    private AccountApi: AccountService,
    private AuthApi: AuthService,
    private localStorage: LocalStorageService,
    private translate: TranslateService,
    private toastr: ToastrService,
    private http: HttpClient,
    private router: Router
  ) {}

  siteUrl: any;
  curLang: any;
  loading: any;
  loginData: any;
  forgotData: any;
  restoreData: any;
  login_success_msg: any;
  content: string;
  show = false;

  ngOnInit() {
    this.content = 'auth';
    this.siteUrl = env.apiUrl;
    this.curLang = this.localStorage.getItem('curLang');
    this.loginData = { email: '', password: '' };
    this.forgotData = { email: '', type: 'client' };
    this.restoreData = { verification_code: '', type: 'client' };

    setTimeout(() => {
      this.translate.get(['auth.login_success']).subscribe((item: any) => {
        this.login_success_msg = item['auth.login_success'];
      });
    }, 500);
  }

  login() {
    this.loading = true;
    this.AuthApi.login(this.loginData).subscribe(
      (res: any) => {
        if (res.access_token) {
          this.loading = false;
          this.getUser();
        }
      },
      (error) => {
        this.loading = false;
        this.toastr.error(error.error.message);
      }
    );
  }

  forgotPassword() {
    this.loading = true;
    return this.http
      .post(env.apiUrl + '/api/forgot-password', this.forgotData)
      .subscribe(
        (res: any) => {
          this.loading = false;
          if (res.status == 'send-email') this.contentAuth('restore');
        },
        (error) => {
          this.loading = false;
          this.toastr.error(error.error.message);
        }
      );
  }

  restorePassword() {
    this.loading = true;
    return this.http
      .post(env.apiUrl + '/api/confirm-verification-code', this.restoreData)
      .subscribe(
        (res: any) => {
          if (res.access_token) {
            this.AuthApi.storeTokens(res);
            this.getUser();
          }
        },
        (error) => {
          this.loading = false;
          this.toastr.error(error.error.message);
        }
      );
  }

  getUser() {
    this.AccountApi.getUser().subscribe(
      (res: any) => {
        if (res) {
          this.loading = false;
          let user = btoa(unescape(encodeURIComponent(JSON.stringify(res))));
          localStorage.setItem('SD', user);
          this.toastr.success(this.login_success_msg);
          this.router.navigate(['/orders']);
        }
      },
      (error) => {
        this.loading = false;
        this.toastr.error(error.error.message);
      }
    );
  }

  contentAuth(content) {
    this.content = content;
  }

  showPassword() {
    this.show = !this.show;
  }
}

@Component({
  selector: 'page-not-found',
  templateUrl: './page-not-found.html',
  styleUrls: [],
})
export class PageNotFoundComponent implements OnInit {
  siteUrl: any;

  constructor() {}

  ngOnInit() {
    this.siteUrl = env.apiUrl;
  }
}
