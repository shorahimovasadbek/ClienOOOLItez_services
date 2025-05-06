import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { env } from "../../environments/environment";
import { Observable } from "rxjs";
import { Socket } from "ngx-socket-io";

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  constructor(
    private http: HttpClient,
    private socket: Socket
  ) { }

  getRequests(data) {
    return this.http.get(env.apiUrl + `/api/client/requests`, {params:data});
  }
  getRequestById(id) {
    return this.http.get(env.apiUrl + `/api/client/requests/${id}`);
  }
  postRequest(data) {
    return this.http.post(env.apiUrl + `/api/client/requests`, data);
  }
  putRequest(data) {
    return this.http.put(env.apiUrl + `/api/client/requests/${data.id}`, data);
  } 
  deleteRequest(id) {
    return this.http.delete(env.apiUrl + `/api/client/requests/${id}`);
  } 




  public createMessage(data) {
    return this.http.post(env.apiUrl+'/api/client/requests-message', data);
  }
  public putMessage(data) {
    return this.http.put(env.apiUrl+'/api/client/requests-message/' + data.uuid, data);
  }
  public deleteMessage(uuid) {
    return this.http.delete(env.apiUrl+'/api/client/requests-message/' + uuid);
  }
  public setAllRead(id) {
    return this.http.get(env.apiUrl+'/api/client/requests-messages-set-all-read/'+id);
  }

  public requestMessageSocket = () => {
    return Observable.create((observer) => {
      if(observer){
        this.socket.on('request-message', (data) => {
          observer.next(data);
        });
      }
    });
  }
}