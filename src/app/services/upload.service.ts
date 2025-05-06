import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  dataFiles:any;
  dataImages:any;
  progress: any;
  img: any;
  progressObserver: any;
  ctx: any;

  constructor (
    private http: HttpClient,
  ) {
    this.progress = new Observable(observer => {
      return this.progressObserver = observer;
    });
  }

  public filePreview(files: any):Observable<any> {
    this.dataFiles = [];
    this.dataImages = [];
    for (let i = 0; i < files.length; i++) {
      if(files[i].type == 'image/jpeg' || files[i].type == 'image/png'){
        let reader = new FileReader();
        reader.onload = () => {
          this.img = document.createElement("img");
          this.img.src = reader.result;
          this.resize(this.img, 2400, 2400, files[i].type, (resized_img:any, file_data:any)=>{
            this.dataImages.push(resized_img);
            file_data['name'] = files[i].name;
            this.dataFiles.push(file_data);
          });
        };
        reader.readAsDataURL(files[i]);
      }
      else 
        this.dataFiles.push(files[i]);
    }
    let data = [{images: this.dataImages, files: this.dataFiles}];
    return of(data);
  } 

  public fileVehiclePreview(files: any):Observable<any> {
    this.dataFiles = [];
    this.dataImages = [];
    for (let i = 0; i < files.length; i++) {
      this.dataFiles.push(files[i]);
    }
    let data = [{images: this.dataImages, files: this.dataFiles}];
    return of(data);
  } 

  public fileUpload (url: string, params: any, files: any, id:any = 0):any {
      let formData: FormData = new FormData(),
          xhr: XMLHttpRequest = new XMLHttpRequest();
     
      for (let i = 0; i < files.length; i++) {
        let type;
        let typeImage = false;

        if(files[i].file){
          if(files[i].file.type == 'application/msword')
            type = '.doc';
          if(files[i].file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            type = '.docx';
          if(files[i].file.type == 'application/vnd.ms-excel')
            type = '.xls';
          if(files[i].file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            type = '.xlsx';
          if(files[i].file.type == 'application/pdf')
            type = '.pdf';

          if(files[i].file.type == 'image/x-citrix-jpeg'){
            type = '.jpg';
            typeImage = true;
          }
          if(files[i].file.type == 'image/jpeg'){
            type = '.jpg';
            typeImage = true;
          }
          if(files[i].file.type == 'image/png'){
            type = '.png';
            typeImage = true;
          }
          if(files[i].file.type == 'image/gif'){
            type = '.gif';
            typeImage = true;
          }
          if(files[i].file.type == 'image/svg+xml'){
            type = '.svg';
            typeImage = true;
          }
          let hash = (new Date().getTime()).toString(36);
          let fName = '';
          if(files[i].file)
            fName = files[i].file.name;
          if(files[i].name)
            fName = files[i].name+type;

          formData.append('uploads['+i+']', files[i].file, fName);
          formData.append('file_types['+i+']', files[i].type);
        }  
        
        if(files[i].type == 'video/mp4'){
          type = '.mp4';
          typeImage = true;
          
          let hash = (new Date().getTime()).toString(36);
          let fName = hash+'_'+files[i].size+'_'+i+type;
          formData.append('uploads['+i+']', files[i], fName);
          formData.append('file_types['+i+']', files[i].type);
        }
        
      }
      
      formData.append("type", params.toString());
      formData.append("id", id);

      return this.http.post(url, formData);
  }

  public fileImport (url: string, type: any, files: any) {    
    let formData: FormData = new FormData(),
        xhr: XMLHttpRequest = new XMLHttpRequest();

    for (let i = 0; i < files.length; i++) {
      let type;
      let typeImage = false;

      if(files[i].type == 'application/vnd.ms-excel')
        type = '.xls';
      if(files[i].type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        type = '.xlsx';
      if(files[i].type == 'text/csv')
        type = '.csv';
      
      let hash = (new Date().getTime()).toString(36);
      let fName = hash+'_'+files[i].size+'_'+i+type;
      let iName = 'uploads['+i+']';
      formData.append(iName, files[i], fName);
    }
    
    formData.append("type", type);

    return this.http.post(url, formData, {
      reportProgress: true,
      observe: 'events'
    });   
  }

  resize(img:any, MAX_WIDTH:number, MAX_HEIGHT:number, img_type:string, callback:any){
    return img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      let canvas = document.createElement("canvas");
    
      canvas.width = width;
      canvas.height = height;
      this.ctx = canvas.getContext("2d");  

      this.ctx.drawImage(img, 0, 0,  width, height); 
      let dataUrl = canvas.toDataURL(img_type);
      var blobBin = atob(dataUrl.split(',')[1]);
      var array = [];
      for(var i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      var data_file = new Blob([new Uint8Array(array)], {type: img_type});

      callback(dataUrl, data_file);
    };
  }

}