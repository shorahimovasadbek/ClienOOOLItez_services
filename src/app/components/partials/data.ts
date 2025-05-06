import { Component, OnInit, Input, Inject, PLATFORM_ID, EventEmitter, Output, ViewChild, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { env } from '../../../environments/environment';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { LocalStorageService } from '../../services/localstorage.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.html'
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  siteUrl = env.apiUrl;
  loading: any;
  isAuthenticated: any;
  currentUser: any;
  user: any;
  curLang: any;
  alertShow: any;
  search: any;
  logout_success_msg: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private AuthApi: AuthService,
    private translate: TranslateService,
    private AccountApi: AccountService,
    private toastr: ToastrService,
    private localStorage: LocalStorageService,
  ) {
    this.router.events.subscribe((e: any) => {
      const navSuccess = e instanceof NavigationEnd;
      if (navSuccess) {
        this.isAuthenticated = this.AuthApi.isAuthenticated();
        this.curLang = this.localStorage.getItem('curLang');
        if (this.localStorage.getItem('SD')) {
          this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
        }
      }
    })
  }
  ngOnInit() {
    this.siteUrl = env.apiUrl;
    setTimeout(() => {
      this.translate.get(['auth.logout_success']).subscribe((item: any) => {
        this.logout_success_msg = item['auth.logout_success'];
      });
    }, 500);
  }
  setLang(lang: any) {
    this.localStorage.setItem('curLang', lang);
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    this.curLang = lang;
    window.location.reload();
  }
  onLogout() {
    this.toastr.success(this.logout_success_msg);
    this.AuthApi.logout();
  }
  closeAlerPopup() {
    this.alertShow = false;
    this.loading = false;
  }
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  collapseMenu = false;
  isMobile = window.innerWidth <= 768;
  constructor() { }

  ngOnInit() { }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleMenu() {
    if (this.isMobile) {
      this.isOpen = !this.isOpen;
    } else {
      this.collapseMenu = !this.collapseMenu;
    }
  }
}
