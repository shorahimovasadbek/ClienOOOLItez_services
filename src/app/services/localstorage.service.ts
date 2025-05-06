import { Injectable, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

export class LocalStorageService {
    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    public clear() {
      if (isPlatformBrowser(this.platformId))
        localStorage.clear();
    }

    public setItem(key: any, value: any) {
      if(isPlatformBrowser(this.platformId))
        localStorage.setItem(key, value);
    }

    public getItem(key:any):any {
      if (isPlatformBrowser(this.platformId))
        return localStorage.getItem(key);
    }

    public removeItem(key: any) {
      if (isPlatformBrowser(this.platformId))
        localStorage.removeItem(key);
    }
}