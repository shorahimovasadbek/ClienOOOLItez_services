import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  private notifyUser: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor (
    private http: HttpClient,
    private socket: Socket,
  ) {}

  public getNotify():any {
    return this.notifyUser.asObservable();
  }

  public updateNotify(status:any) {
    this.notifyUser.next(status);
  }

  public sendCommentSocket = () => {
    return Observable.create((observer:any) => {
      if(observer){
        this.socket.on('send-comment', (data:any) => {
          observer.next(data);
        });
      }
    });
  }

  public notifyCountSocket = () => {
    return Observable.create((observer:any) => {
      if(observer){
        this.socket.on('notify-count', (data:any) => {
          observer.next(data);
        });
      }
    });
  }

}  