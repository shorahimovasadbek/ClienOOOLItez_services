import { Component, ElementRef, OnInit } from '@angular/core';
import { LocalStorageService } from '../../services/localstorage.service';
import { DocumentsService } from '../../services/documents.service';
import { CompaniesService } from '../../services/companies.service';
import { ActivatedRoute } from '@angular/router';
import { env } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { FileSaverService } from 'ngx-filesaver';
import { UploadService } from '../../services/upload.service';
import { Fancybox } from '@fancyapps/ui/dist/fancybox/fancybox.esm.js';
import dayjs from 'dayjs';

@Component({
  selector: 'documents',
  templateUrl: './data.html',
})
export class DocumentsComponent implements OnInit {
  loadingPage = false;
  loading = false;
  dataItems = [];
  companies = [];
  selectedDateRange;
  filter;
  alertShowColumns = false;
  uploading;
  showFilters;
  filterModal;
  pageParams = {
    from: 0,
    to: 0,
    total: 0,
    current_page: 0,
    last_page: 0,
  };
  statuses = [
    { title: 'Договоры и соглашения', val: 'contr', checked: false },
    { title: 'Уставные документы', val: 'docs', checked: false },
  ];

  constructor(
    private DataApi: DocumentsService,
    private CompanyApi: CompaniesService,
    private localStorage: LocalStorageService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.filter = {
      page: 1,
      type: 'document',
      customer: '',
      per_page: 30,
      date: null,
      ship_date: null,
    };

    this.route.queryParams.subscribe((params: any) => {
      if (params && params.customer) {
        this.filter.customer = params.customer;
      } else {
        this.filter.customer = '';
      }
    });

    this.CompanyApi.getCompanies().subscribe((res: any) => {
      if (res) {
        this.companies = res;
      }
    });
  }

  getDataItems() {
    this.loadingPage = true;
    this, (this.dataItems = []);
    this.DataApi.getDocuments(this.filter).subscribe(
      (res: any) => {
        if (res) {
          this.dataItems = res.result.data;
          this.pageParams = {
            total: res.result.total,
            from: (res.result.current_page - 1) * res.result.per_page + 1,
            to: Math.min(
              res.result.current_page * res.result.per_page,
              res.result.total
            ),
            current_page: res.result.current_page,
            last_page: res.result.last_page,
          };
          this.loadingPage = false;
          this.filterModal = false;
        }
      },
      (err) => {
        this.filterModal = false;
        this.loadingPage = false;
      }
    );
  }

  selectedStatus(selectedItem) {
    this.selectedDateRange = null;
    this.statuses.forEach((item) => (item.checked = false));
    selectedItem.checked = true;
    this.filter.type = selectedItem.val;
    this.getDataItems();
  }

  anyChecked(): boolean {
    return this.statuses.some((item) => item.checked);
  }

  onDateRangeChange(event: any): void {
    if (event?.startDate && event?.endDate) {
      this.filter.from_date = event.startDate.format('YYYY-MM-DD');
      this.filter.to_date = event.endDate.format('YYYY-MM-DD');
    } else {
      this.filter.from_date = null;
      this.filter.to_date = null;
    }
    this.getDataItems();
  }
  clearDate() {
    this.selectedDateRange = '';
    this.filter.from_date = '';
    this.filter.to_date = '';
    this.getDataItems();
  }
  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.pageParams.last_page) return;
    this.filter.page = newPage;
    this.pageParams.current_page = newPage;
    this.getDataItems();
  }
  updatePageSize(perPage: number) {
    this.filter.page = 1;
    this.localStorage.setItem('per_page', perPage);
    this.filter.per_page = perPage;
    this.getDataItems();
  }
  setSort(columnKey: string, direction: 'asc' | 'desc'): void {
    if (this.filter.sort_type === columnKey && this.filter.sort === direction) {
      this.filter.sort_type = '';
      this.filter.sort = '';
    } else {
      this.filter.sort_type = columnKey;
      this.filter.sort = direction;
    }
    this.getDataItems();
  }
  closeAlert() {
    this.filterModal = false;
  }
  resetFilter() {
    this.filter = {
      page: 1,
      type: this.filter.type,
      per_page: 30,
      num_contr: '',
      num: '',
      date: null,
      ship_date: null,
    };
    this.selectedDateRange = null;
    this.getDataItems();
  }
  filterDateChanged(date, type) {
    if (date && date.startDate) {
      this.filter[type] = dayjs(date.startDate.$d).format('YYYY-MM-DD');
    } else {
      this.filter[type] = null;
    }
  }
}

@Component({
  selector: 'documents-order-detail',
  templateUrl: './detail-order.html',
})
export class DocumentsOrderDetailComponent implements OnInit {
  data: any;
  loadingPage = false;
  siteUrl = env.apiUrl;
  checkedFileCount;
  selectedFile;
  activeFilter: string = 'all';
  filteredFiles;
  loading = false;
  id: any;
  type: any;
  checked_all;
  formats;
  uploading = false;
  uploadingText = '';
  uploadFiles = [];
  detailModal = false;
  isFullScreen = false;
  constructor(
    private route: ActivatedRoute,
    private DataApi: DocumentsService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private fileSaver: FileSaverService,
    private UploadApi: UploadService,
    private elRef: ElementRef
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    this.type = this.route.snapshot.paramMap.get('type');
    this.activeFilter = this.route.snapshot.paramMap.get('file-type?');
  }
  ngOnInit(): void {
    Fancybox.bind(this.elRef.nativeElement, '[data-fancybox]', {
      Toolbar: {
        display: {
          left: ['infobar'],
          middle: [
            'zoomIn',
            'zoomOut',
            'toggle1to1',
            'rotateCCW',
            'rotateCW',
            'flipX',
            'flipY',
          ],
          right: ['slideshow', 'thumbs', 'close'],
        },
      },
    });

    this.formats = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
    };

    this.getData();
  }
  getData() {
    this.loadingPage = true;
    this.DataApi.getDocument({ id: this.id, type: this.type }).subscribe(
      (res: any) => {
        if (res) {
          this.loadingPage = false;
          this.data = res.result;
          this.data.files.forEach((file: any) => {
            if (file) {
              file.checked = false;
              if (
                file.mime_type == 'image' ||
                file.mime_type == 'jpg' ||
                file.mime_type == 'png'
              ) {
                file.rotate = 0;
              }
            }
          });

          this.filterFiles(this.activeFilter);
        }
      },
      (err) => {
        this.loadingPage = false;
      }
    );
  }
  onFileClick(file): void {
    if (this.isMobile()) {
      const fileUrl = `${this.siteUrl}/uploads/documents/${file.type}/${file.filename}`;
      window.open(fileUrl, '_blank');
    }
    if ((this.selectedFile && this.selectedFile.id) !== file.id) {
      this.selectedFile = file;
      this.data.files.forEach((f) => {
        f.selected = f === file ? !f.selected : false;
      });
      this.updateCheckedFileCount();
    }
  }
  onCheckboxChange(file): void {
    this.updateCheckedFileCount();
  }
  updateCheckedFileCount(): void {
    const checkedFiles = this.data.files.filter((file) => file.checked);
    this.checkedFileCount = checkedFiles.length;
  }
  getSelectedFileImage(): string {
    const selectedFile = this.data.files.find((file) => file.selected);
    if (selectedFile) {
      return `${this.siteUrl}/uploads/documents/${selectedFile.type}/${selectedFile.filename}`;
    }
    return '';
  }
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toastr.success(this.translate.instant('text_copied'));
    });
  }
  filterFiles(type: string): void {
    this.selectedFile = null;
    this.activeFilter = type;
    if (this.data && this.data.files) {
      this.data.files.forEach((file) => {
        (file.checked = false), (file.selected = false);
      });
    }
    if (type === 'all') {
      this.filteredFiles = this.data.files;
    } else {
      this.filteredFiles = this.data.files.filter((file) => file.type === type);
    }
  }
  downloadDocuments() {
    var files_id = [];
    this.data.files.forEach((item: any) => {
      if (item && item.checked) files_id.push(item.id);
    });

    if (files_id.length > 0) {
      this.loading = true;
      var data = {
        files_id: files_id,
        type: this.activeFilter,
        id: this.data.id,
      };
      this.DataApi.downloadDocuments(data).subscribe(
        (res: any) => {
          this.loading = false;
          if (res.size > 0) {
            this.fileSaver.save(
              res,
              this.data.num
                ? this.data.num
                : this.data.original_name + '_documents.zip'
            );
            this.checked_all = false;
            this.data.files.forEach((item: any) => {
              item.checked = false;
            });
          }
        },
        (error) => {
          this.loading = false;
          this.toastr.error(error.error.message);
        }
      );
    }
    if (files_id.length == 0)
      this.toastr.error('Выберите файл для скачивания!');
  }
  shareFiles(platform: 'tg' | 'wa'): void {
    const checkedFiles = this.data.files.filter((file) => file.checked);

    if (!checkedFiles.length) {
      this.toastr.error('Выберите файл для отправки!');
      return;
    }
    const messages = checkedFiles.map((file) => {
      const fileUrl = file.client
        ? `${this.siteUrl}/uploads/mail-files/${file.filename}`
        : `${this.siteUrl}/uploads/documents/${file.type}/${file.filename}`;
      return `Файл ${file.original_name}: ${fileUrl}`;
    });
    let finalMessage = messages.join('\n');
    if (platform === 'wa') {
      finalMessage = `Litez.uz\n${finalMessage}`;
    }
    const encodedMessage = encodeURIComponent(finalMessage);
    if (platform === 'tg') {
      window.open(
        `https://t.me/share/url?url=Litez.uz&text=${encodedMessage}`,
        '_blank'
      );
    } else if (platform === 'wa') {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  }
  getCheckedFiles(): string[] {
    return this.filteredFiles.filter((file) => file.checked);
  }
  onFileChange(event) {
    let images = [];
    let files = [];
    if (event.target.files && event.target.files.length > 0) {
      if (
        event.target.files[0].type == 'image/jpg' ||
        event.target.files[0].type == 'image/jpeg' ||
        event.target.files[0].type == 'image/png' ||
        event.target.files[0].type == 'application/pdf' ||
        event.target.files[0].type ==
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        event.target.files[0].type == 'application/msword' ||
        event.target.files[0].type == 'application/vnd.ms-excel' ||
        event.target.files[0].type ==
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        this.uploading = true;
        this.uploadingText = 'Загрузка файла ...';
        this.UploadApi.filePreview(event.target.files).subscribe((res: any) => {
          if (res) {
            files.push(res[0].files);
            images.push(res[0].images);
          }
        });
      } else this.toastr.error('Неверный формат файла');
    }

    setTimeout(() => {
      if (files.length > 0) {
        files[0].forEach((file: any, index: any) => {
          if (file) {
            if (!file.name) file.name = event.target.files[index].name;

            this.uploadFiles.push({ file: file, type: 'signed' });
          }
        });
        var apiUrl = env.apiUrl + '/api/document-upload';
        this.UploadApi.fileUpload(
          apiUrl,
          'doc_' + 'signed',
          this.uploadFiles,
          this.data.doc_id
        ).subscribe(
          (data: any) => {
            if (data.status == 'success') {
              this.getData();
              this.uploadFiles = [];
              this.uploading = false;
              this.uploadingText = '';
              if (<HTMLInputElement>document.getElementById('uploadFiles'))
                (<HTMLInputElement>(
                  document.getElementById('uploadFiles')
                )).value = '';
            }
          },
          (error) => {
            this.uploadFiles = [];
            this.uploading = false;
            this.uploadingText = '';
            if (<HTMLInputElement>document.getElementById('uploadFiles'))
              (<HTMLInputElement>document.getElementById('uploadFiles')).value =
                '';
            if (error.error) this.toastr.error(error.error.message);
          }
        );
      }
    }, 500);
  }
  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  getCountByType(type: string): number {
    if (!this.data || !this.data.files) {
      return 0;
    }
    if (type === 'all') {
      return this.data.files.length;
    }
    return this.data.files.filter((file) => file.type === type).length;
  }

  rotate(item) {
    item.rotate = Number(item.rotate) + 90;
  }

  showDetailOrder() {
    this.detailModal = !this.detailModal;
  }
  closeAlert() {
    this.detailModal = false;
  }
  openFullScreen() {
    if (this.selectedFile) {
      this.isFullScreen = true;
    }
  }
  getFileUrl(file: any): string {
    if (file.section !== 'customer') {
      return `${this.siteUrl}/uploads/documents/${file.type}/${file.filename}`;
    } else {
      return `https://panel.litez.uz${file.container}${file.filename}`;
    }
  }

  closeFullScreen() {
    this.isFullScreen = false;
  }
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }
}
