import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor (
    private http: HttpClient
  ) {}

  public checkToken(data:any) {
    return this.http.post(env.apiUrl+'/api/auth/check-access-client', data);
  }
  public getUser() {
    return this.http.get(env.apiUrl+'/api/user/id');
  }
  public updateUser(data:any) {
    return this.http.post(env.apiUrl+'/api/client-update', data);
  }

}  