import { Component } from '@angular/core';
import { LocalStorageService } from './services/localstorage.service';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from './services/account.service';
import { AuthService } from './services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  isSidebarOpen = false;

  logout_success_msg:any;
  isAuthenticated:boolean;

	constructor(
		private localStorage:LocalStorageService,
    private AccountApi: AccountService,
    private AuthApi: AuthService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private router: Router,
	) {
    this.router.events.subscribe((e:any) => { 
      const navSuccess = e instanceof NavigationEnd;
      if(navSuccess){
        this.isAuthenticated = this.AuthApi.isAuthenticated();
        if(!this.localStorage.getItem('curLang')){
          this.localStorage.setItem('curLang','ru');
          this.defaultTranslate('ru');
        }
        
        if(this.localStorage.getItem('curLang')){
          let lang = this.localStorage.getItem('curLang');
          this.defaultTranslate(lang);
        }

        if(this.localStorage.getItem('SD')){
          setTimeout(() => {
            this.checkToken();
          }, 1000)
        }
      }
    })
  }

  ngOnInit() {
    setTimeout(() => {
      this.translate.get(['auth.logout_success']).subscribe((item:any) => {
        this.logout_success_msg = item['auth.logout_success'];
      });
    }, 500)
  }

  defaultTranslate(lang:any){
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
  }

  checkToken(){
    var token = this.AuthApi.getJwtToken();
    this.AccountApi.checkToken({access_key: token}).subscribe((res:any) => {
      if(res && res.status == 'logout')
        this.onLogout();
    })
  }

  onLogout() {
    this.toastr.success(this.logout_success_msg);
    this.AuthApi.logout();
  }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
