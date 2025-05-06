import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor (
    private http: HttpClient
  ) {}

  public deleteFile(data:any) {
    return this.http.put(env.apiUrl+'/api/file/'+data.id, data);
  }

  public downloadDocuments(data) {
    return this.http.post(env.apiUrl+'/api/download-documents',data,{responseType:'blob'});
  }
}  