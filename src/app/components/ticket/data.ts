import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../services/ticket.service';
import { TranslateService } from '@ngx-translate/core';
import { FileService } from '../../services/file.service';
import { UploadService } from '../../services/upload.service';
import { LocalStorageService } from '../../services/localstorage.service';
import { ToastrService } from 'ngx-toastr';
import { env } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ticket',
  templateUrl: './data.html',
})
export class TicketComponent implements OnInit {
  loading = false;
  data: any;
  dataItems: any;
  selectedFiles: File[] = [];
  success_updated_mes: any;
  format_file_incorrect_mes: any;
  file_removing_mes: any;
  file_uploading_mes: any;
  countries: any;
  uploading: any;
  uploadingText: any;
  uploadFiles: any[] = [];
  files: any[] = [];
  constructor(
    private DataApi: TicketService,
    private translate: TranslateService,
    private UploadApi: UploadService,
    private FileApi: FileService,
    private toastr: ToastrService
  ) {}
  ngOnInit(): void {
    this.data = { title: null, subject: null, files: [] };
    this.getDataItems();
    setTimeout(() => {
      this.translate
        .get([
          'success_updated',
          'format_file_incorrect',
          'file_removing',
          'file_uploading',
        ])
        .subscribe((item: any) => {
          this.success_updated_mes = item['success_updated'];
          this.format_file_incorrect_mes = item['format_file_incorrect'];
          this.file_removing_mes = item['file_removing'];
          this.file_uploading_mes = item['file_uploading'];
        });
    }, 500);
  }

  getDataItems() {
    this.DataApi.getTickets().subscribe((res: any) => {
      if (res) {
        this.dataItems = res;
      }
    });
  }
  postTicket() {
    this.loading = true;
    this.DataApi.postTicket(this.data).subscribe(
      (res: any) => {
        if (res) {
          this.toastr.success(this.translate.instant('success_saved'));
          this.getDataItems();
          this.loading = false;
          this.data = { title: null, subject: null, files: [] };
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '/assets/images/jpg.png';
      case 'pdf':
        return '/assets/images/pdf.png';
      case 'zip':
        return '/assets/images/zip.png';
      default:
        return '/assets/images/default-icon.png';
    }
  }
  removeFile(item: any, index: any) {
    this.uploading = true;
    this.uploadingText = this.translate.instant('file_removing');
    var data = { filename: item.filename, id: 0, type: 'ticket' };
    this.FileApi.deleteFile(data).subscribe(
      (data: any) => {
        this.uploading = false;
        if (data) this.data.files.splice(index, 1);
      },
      (err) => {
        this.uploading = false;
      }
    );
  }
  uploadPhoto(event: any) {
    const images = [];
    this.files = [];
    this.uploadFiles = [];
    if (event.target.files && event.target.files.length > 0) {
      const validTypes = [
        'image/jpg',
        'image/jpeg',
        'image/png',
        'application/pdf',
      ];
      for (let file of event.target.files) {
        if (validTypes.includes(file.type)) {
          this.files.push(file);
        } else {
          this.toastr.error(this.format_file_incorrect_mes);
          return;
        }
      }

      this.uploading = true;
      this.uploadingText = this.translate.instant('file_uploading');

      setTimeout(() => {
        this.files.forEach((file: any) => {
          this.uploadFiles.push({ file, type: 'ticket' });
        });

        const apiUrl = env.apiUrl + '/api/file';
        this.UploadApi.fileUpload(apiUrl, 'ticket', this.uploadFiles).subscribe(
          (res: any) => {
            if (res) {
              res.data.forEach((item: any, index: number) => {
                this.data.files.push({
                  filename: item.file,
                  original_name: this.files[index].name,
                });
              });
              this.uploadFiles = [];
              this.uploading = false;
              if (<HTMLInputElement>document.getElementById('uploadPhotos')) {
                (<HTMLInputElement>(
                  document.getElementById('uploadPhotos')
                )).value = '';
              }
            }
          },
          (err) => {
            this.uploading = false;
          }
        );
      }, 500);
    }
  }
}

@Component({
  selector: 'ticket-detail',
  templateUrl: './detail.html',
})
export class TicketDetailComponent implements OnInit {
  data;
  siteUrl = env.apiUrl;
  loading: boolean = false;
  activeTab: string = 'comments';
  currentUser: any;
  comment: any = { message: '', ticket_id: '' };
  uploading: any;
  uploadingText: any;
  uploadFiles: any[] = [];
  files: any[] = [];
  success_updated_mes:string;
  format_file_incorrect_mes:string;
  file_removing_mes:string;
  file_uploading_mes:string;
  is_edit:boolean;

  constructor(
    private DataApi: TicketService,
    private translate: TranslateService,
    private localStorage: LocalStorageService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private UploadApi: UploadService,
    private FileApi: FileService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.currentUser = JSON.parse(
      decodeURIComponent(escape(atob(this.localStorage.getItem('SD'))))
    );
    setTimeout(() => {
      this.translate
        .get([
          'success_updated',
          'format_file_incorrect',
          'file_removing',
          'file_uploading',
        ])
        .subscribe((item: any) => {
          this.success_updated_mes = item['success_updated'];
          this.format_file_incorrect_mes = item['format_file_incorrect'];
          this.file_removing_mes = item['file_removing'];
          this.file_uploading_mes = item['file_uploading'];
        });
    }, 500);

    this.getData();
  }
  addComment() {
    this.loading = true;
    this.comment.ticket_id = this.data.id;
    this.DataApi.putTicket(this.comment).subscribe(
      (res: any) => {
        if (res) {
          this.loading = false;
          this.toastr.success(this.translate.instant('success_saved'));
          this.getData();
          this.comment = { message: '', ticket_id: '' };
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  getData() {
    this.route.params.subscribe((res: any) => {
      if (res.id) {
        this.DataApi.getTicket(res.id).subscribe((res: any) => {
          if (res && res.success) {
            this.data = res.result;
          }
        });
      }
    });
  }
  delete() {
    if (this.data.status == 'pending') {
      this.loading = true;
      this.DataApi.deleteTicket(this.data.id).subscribe(
        (res: any) => {
          if (res) {
            this.loading = false;
            this.toastr.success(this.translate.instant('success_deleted'));
            this.router.navigate(['/tickets']);
          }
        },
        (err) => {
          this.loading = false;
        }
      );
    }
  }

  closeTicket() {
    this.loading = true;
    this.DataApi.closeTicket(this.data.id).subscribe(
      (res: any) => {
        if (res) {
          this.loading = false;
          this.toastr.success(this.translate.instant('success_saved'));
          this.getData();
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }
  deleteMessage(item) {
    this.loading = true;
    this.DataApi.deleteMessage(item.id).subscribe(
      (res: any) => {
        if (res) {
          this.loading = false;
          this.toastr.success(this.translate.instant('success_deleted'));
          this.getData();
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '/assets/images/jpg.png';
      case 'pdf':
        return '/assets/images/pdf.png';
      case 'zip':
        return '/assets/images/zip.png';
      default:
        return '/assets/images/default-icon.png';
    }
  }

  saveData(){
    this.loading = true;
    this.DataApi.updateTicket({id:this.data.id, type:'message',message:this.data.message}).subscribe((res:any) => {
      if(res){
        this.loading = false;
        this.toastr.success(this.success_updated_mes);
        this.is_edit = false;
      }
    });
  }
  
  removeFile(item: any, index: any) {
    this.uploading = true;
    this.uploadingText = this.translate.instant('file_removing');
    var data = { filename: item.filename, id: 0, type: 'ticket' };
    this.FileApi.deleteFile(data).subscribe(
      (data: any) => {
        this.uploading = false;
        if (data) this.data.files.splice(index, 1);

        this.DataApi.updateTicket({id:this.data.id, type:'rm_file',file_id:item.id}).subscribe();
      },
      (err) => {
        this.uploading = false;
      }
    );
  }

  uploadPhoto(event: any) {
    const images = [];
    this.files = [];
    this.uploadFiles = [];
    if (event.target.files && event.target.files.length > 0) {
      const validTypes = [
        'image/jpg',
        'image/jpeg',
        'image/png',
        'application/pdf',
      ];
      for (let file of event.target.files) {
        if (validTypes.includes(file.type)) {
          this.files.push(file);
        } else {
          this.toastr.error(this.format_file_incorrect_mes);
          return;
        }
      }

      this.uploading = true;
      this.uploadingText = this.translate.instant('file_uploading');

      setTimeout(() => {
        this.files.forEach((file: any) => {
          this.uploadFiles.push({ file, type: 'ticket' });
        });

        const apiUrl = env.apiUrl + '/api/file';
        this.UploadApi.fileUpload(apiUrl, 'ticket', this.uploadFiles).subscribe(
          (res: any) => {
            if (res) {
              res.data.forEach((item: any, index: number) => {
                this.DataApi.updateTicket({id:this.data.id, type:'add_file',filename:item.file, original_name: this.files[index].name}).subscribe((res:any) => {
                  if(res.file_id){
                    this.data.files.push({
                      id: res.file_id,
                      filename: item.file,
                      original_name: this.files[index].name,
                    });
                  }
                });

              });
              this.uploadFiles = [];
              this.uploading = false;
              if (<HTMLInputElement>document.getElementById('uploadPhotos')) {
                (<HTMLInputElement>(
                  document.getElementById('uploadPhotos')
                )).value = '';
              }
            }
          },
          (err) => {
            this.uploading = false;
          }
        );
      }, 500);
    }
  }
}
