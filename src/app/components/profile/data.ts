import { Component, OnInit } from '@angular/core';
import { env } from '../../../environments/environment';
import { AccountService } from '../../services/account.service';
import { LocalStorageService } from '../../services/localstorage.service';
import { FileService } from '../../services/file.service';
import { UploadService } from '../../services/upload.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'profile',
  templateUrl: './data.html'
})
export class ProfileComponent implements OnInit {

  constructor(
    private DataApi: AccountService,
    private FileApi: FileService,
    private UploadApi: UploadService,
    private localStorage: LocalStorageService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) { }

  siteUrl: any;
  body_types: any;
  curLang: any;
  currentUser: any;
  loading: any;
  data: any;
  is_access: any;
  success_updated_mes: any;
  format_file_incorrect_mes: any;
  file_removing_mes: any;
  file_uploading_mes: any;
  countries: any;
  uploading: any;
  uploadingText: any;
  uploadFiles: any = [];
  files: any;

  ngOnInit() {
    this.siteUrl = env.apiUrl;
    this.curLang = this.localStorage.getItem('curLang');
    this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));

    setTimeout(() => {
      this.translate.get(['success_updated', 'format_file_incorrect', 'file_removing', 'file_uploading']).subscribe((item: any) => {
        this.success_updated_mes = item['success_updated'];
        this.format_file_incorrect_mes = item['format_file_incorrect'];
        this.file_removing_mes = item['file_removing'];
        this.file_uploading_mes = item['file_uploading'];
      });
    }, 500)
  }

  removeFile() {
    this.uploading = true;
    this.uploadingText = this.file_removing_mes + ' ...';
    var data = { file: this.currentUser.photo, id: this.currentUser.id, type: 'client' }
    this.FileApi.deleteFile(data).subscribe((data: any) => {
      this.uploading = false;
      if (data && data.success) {
        this.currentUser.photo = '';
        this.patchData();
      }
    });
  }

  uploadPhoto(event: any) {
    var images = [];
    this.files = [];
    if (event.target.files && event.target.files.length > 0) {
      if (event.target.files[0].type == 'image/jpg' || event.target.files[0].type == 'image/jpeg' || event.target.files[0].type == 'image/png') {
        this.uploading = true;
        this.uploadingText = this.file_uploading_mes + ' ...';
        this.UploadApi.filePreview(event.target.files).subscribe((res: any) => {
          if (res) {
            this.files.push(res[0].files);
            images.push(res[0].images);
          }
        });
      } else
        this.toastr.error(this.format_file_incorrect_mes);
    }
    setTimeout(() => {
      if (this.files.length > 0) {
        this.files.forEach((file: any) => {
          if (file[0])
            this.uploadFiles.push({ file: file[0], type: 'client' });
        })
        var apiUrl = env.apiUrl + '/api/file';
        this.UploadApi.fileUpload(apiUrl, 'client', this.uploadFiles).subscribe((res: any) => {
          if (res.status == 'success') {
            res.data.forEach((item: any) => {
              this.currentUser.photo = item.file;
            });
            this.uploadFiles = [];
            this.uploading = false;
            this.patchData();
            if (<HTMLInputElement>document.getElementById("uploadPhoto"))
              (<HTMLInputElement>document.getElementById("uploadPhoto")).value = '';
          }
        });
      }
    }, 500);
  }

  patchData() {
    this.loading = true;
    this.DataApi.updateUser(this.currentUser).subscribe((res: any) => {
      if (res.success) {
        this.loading = false;
        this.toastr.success(this.success_updated_mes);
        let user = btoa(unescape(encodeURIComponent(JSON.stringify(this.currentUser))));
        localStorage.setItem('SD', user);
      }
    }, error => {
      this.loading = false;
    })
  }

}