import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ColleaguesService } from "../../services/colleagues.service";
import { LocalStorageService } from "../../services/localstorage.service";
import { env } from "../../../environments/environment";
import { Subject, debounceTime, distinctUntilChanged, startWith, switchMap } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { FileService } from "../../services/file.service";
import { UploadService } from "../../services/upload.service";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { CompaniesService } from "../../services/companies.service";
import { CountryISO, SearchCountryField } from "ngx-intl-tel-input";

@Component({
    selector: 'colleagues',
    templateUrl: './data.html'
})
export class ColleaguesComponent implements OnInit {
    siteUrl = env.apiUrl;
    loadingPage = false;
    dataItems

    filter
    isColleaguesRoute
    currentUser
    private searchSubject = new Subject<string>();
    constructor(
        private DataApi: ColleaguesService,
        private router: Router,
        private localStorage: LocalStorageService
    ) {
        this.router.events.subscribe(() => {
            this.isColleaguesRoute = this.router.url === '/colleagues';
        });
    }
    ngOnInit() {
        this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
        this.filter = { name: '', status: '' }
        this.getDataItems();
    }

    getDataItems() {
        this.loadingPage = true;
        this.searchSubject
            .pipe(
                startWith(''),
                debounceTime(500),
                distinctUntilChanged(),
                switchMap(name => this.DataApi.getColleagues(this.filter))
            )
            .subscribe(res => {
                this.dataItems = res || [];
                this.loadingPage = false;
            }, () => this.loadingPage = false);
    }
    search() {
        this.searchSubject.next(this.filter.name);
    }
    changeStatus() {
        this.filter.status = this.filter.status === 'archive' ? '' : 'archive';
        this.getDataItems();
    }
}

@Component({
    selector: 'colleagues-detail',
    templateUrl: './detail.html'
})
export class ColleagueDetailComponent implements OnInit {
    siteUrl = env.apiUrl;
    loadingPage = false;
    loading = false;
    data
    activeButton = 'profile';
    currentUser
    constructor(
        private DataApi: ColleaguesService,
        private localStorage: LocalStorageService,
        private route: ActivatedRoute,
        private router: Router,
        private toastr: ToastrService,
        private translate: TranslateService
    ) { }
    ngOnInit() {
        this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
        this.getData();
        this.router.events.subscribe(() => {
            const urlSegments = this.router.url.split('/');
            this.activeButton = urlSegments[urlSegments.length - 1];
        });
    }

    getData() {
        this.loadingPage = true;
        this.DataApi.getColleague(this.route.snapshot.params['id']).subscribe((res: any) => {
            this.data = res.result;
            this.loadingPage = false;
        }, () => this.loadingPage = false);
    }
    setActive(button: string) {
        this.activeButton = button;
        if (button === 'profile') {
            this.router.navigate(['/colleagues', this.data.id, 'profile']);
        }
        if (button === 'tasks') {
            this.router.navigate(['/colleagues', this.data.id, 'tasks']);
        }
        if (button === 'colleagues') {
            this.router.navigate(['/colleagues', this.data.id, 'colleagues']);
        }
        if (button === 'reviews') {
            this.router.navigate(['/colleagues', this.data.id, 'reviews']);
        }
    }
    deleteColleague() {
        this.loading = true;
        this.DataApi.deleteColleague(this.data.id).subscribe((res: any) => {
            if (res) {
                this.loading = false;
                this.toastr.success(this.translate.instant('success_deleted'));
                this.router.navigate(['/colleagues']);
            }
        })
    }
}

@Component({
    selector: 'add-colleague',
    templateUrl: './add.html'
})
export class ColleagueAddComponent implements OnInit {
    [x: string]: any;
    siteUrl = env.apiUrl;
    data
    loading = false;
    companies = []
    success_updated_mes: any;
    format_file_incorrect_mes: any;
    file_removing_mes: any;
    file_uploading_mes: any;
    countries: any;
    uploading: any;
    uploadingText: any;
    uploadFiles: any = [];
    files: any;
    SearchCountryField = SearchCountryField;
    CountryISO = CountryISO;
    preferredCountries: CountryISO[] = [
        CountryISO.UnitedStates,
        CountryISO.UnitedKingdom
    ];
    constructor(
        private DataApi: ColleaguesService,
        private companyApi: CompaniesService,
        private router: Router,
        private FileApi: FileService,
        private UploadApi: UploadService,
        private toastr: ToastrService,
        private translate: TranslateService
    ) { }
    ngOnInit(): void {
        this.getCompanies();
        this.translate.get('colleagues').subscribe((res: any) => {
            this.success_updated_mes = res.success_updated_mes;
            this.format_file_incorrect_mes = res.format_file_incorrect_mes;
            this.file_removing_mes = res.file_removing_mes;
            this.file_uploading_mes = res.file_uploading_mes;
        });
        this.data = { phone: '+998', email: '', name: '', job: '', department: '', password: '', photo: '', telegram: '', whatsapp: '' }
    }

    patchData() {
        if (!this.data.name || !this.data.email || !this.data.job || !this.data.department || !this.data.password) {
            this.toastr.error(this.translate.instant('error_required_fields'));
            return;
        }
        this.data.phone = this.data.phone.number;
        this.data.status = 'active'
        this.loading = true;
        this.DataApi.postColleague(this.data).subscribe((res: any) => {
            if (res) {
                this.loading = false;
                this.toastr.success(this.translate.instant('success_saved'));
                this.router.navigate(['/colleagues']);
            }
        }, err => {
            this.loading = false;
        });
    }

    removeFile() {
        this.uploading = true;
        this.uploadingText = this.file_removing_mes + ' ...';
        var data = { file: this.data.photo, id: this.data.id, type: 'client' }
        this.FileApi.deleteFile(data).subscribe((data: any) => {
            this.uploading = false;
            if (data && data.success) {
                this.data.photo = '';
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
                            this.data.photo = item.file;
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

    getCompanies() {
        this.companyApi.getCompanies().subscribe((res: any) => {
            if (res) {
                this.companies = res;
            }
        })
    }

}

@Component({
    selector: 'colleagues-profile',
    templateUrl: './profile.html'
})
export class ColleagueProfileComponent implements OnInit {
    is_access = false;
    siteUrl = env.apiUrl;
    currentUser: any;
    loadingPage = false;
    loading = false;
    data: any = {};
    id: any;
    companies = [];
    success_updated_mes: any;
    format_file_incorrect_mes: any;
    file_removing_mes: any;
    file_uploading_mes: any;
    countries: any;
    uploading: any;
    uploadingText: any;
    uploadFiles: any = [];
    files: any;
    SearchCountryField = SearchCountryField;
    CountryISO = CountryISO;
    preferredCountries: CountryISO[] = [
        CountryISO.UnitedStates,
        CountryISO.UnitedKingdom
    ];
    constructor(
        private DataApi: ColleaguesService,
        private localStorage: LocalStorageService,
        private route: ActivatedRoute,
        private router: Router,
        private FileApi: FileService,
        private UploadApi: UploadService,
        private toastr: ToastrService,
        private translate: TranslateService,
        private companyApi: CompaniesService
    ) {
        this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
        this.id = this.route.parent.snapshot.params['id'];
        if (this.id != 0) {
            this.getData();
        }
    }
    ngOnInit() {
        this.getCompanies();
    }

    getData() {
        this.loadingPage = true;
        this.DataApi.getColleague(this.id).subscribe((res: any) => {
            this.data = res.result;
            this.is_access = this.currentUser.role == 'client' && this.data.status !== 'archive'
            this.loadingPage = false;
        }, () => this.loadingPage = false);
    }
    getCompanies() {
        this.companyApi.getCompanies().subscribe((res: any) => {
            if (res) {
                this.companies = res
            }
        })
    }

    patchData() {
        this.loading = true;
        this.data.phone = this.data.phone.number
        this.DataApi.putColleague(this.data).subscribe((res: any) => {
            if (res) {
                this.loading = false;
                this.toastr.success(this.translate.instant('success_updated'));
                this.router.navigate(['/colleagues'])
            }
        }, err => {
            this.loading = false;
        })
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
}

@Component({
    selector: 'colleagues-tasks',
    templateUrl: './col-tasks.html'
})
export class ColleagueTasksComponent implements OnInit {
    @ViewChild('tooltip') tooltip!: ElementRef;
    tooltipVisible = false;
    tooltipData: any[] = [];
    siteUrl = env.apiUrl;
    loadingPage = false;
    id
    data
    filter
    pageParams
    statuses = [
        { val: 'open', title: 'Открыты', count: 0, color: 'badge', checked: false, class: "open" },
        { val: 'in_work', title: 'В работе', count: 0, color: 'badge-blue', checked: false, class: "working" },
        { val: 'complete', title: 'Выполнены', count: 0, color: 'badge-success', checked: false, class: "task-completed" },
        { val: 'pending', title: 'На рассмотрении', count: 0, color: 'badge-border-success', class: "waiting", checked: false },
        { val: 'cancel', title: 'Отменены', count: 0, color: 'badge-danger', checked: false, class: "canceled" },
    ];
    constructor(
        private DataApi: ColleaguesService,
        private route: ActivatedRoute
    ) {
        this.id = this.route.parent.snapshot.params['id'];
        if (this.id != 0) {
            this.getData();
        }
    }
    ngOnInit(): void {
        this.getData();
    }
    getData() {
        this.loadingPage = true;
        this.DataApi.getColleague(this.id).subscribe((res: any) => {
            this.data = res.result.tasks;
            this.loadingPage = false;
        }, () => this.loadingPage = false);
    }

    clearInput(filterKey: string) {
        this.filter[filterKey] = '';
    }
    showTooltip(event: MouseEvent, viewers: any[]) {
        event.stopPropagation();
        this.tooltipData = viewers;
        this.tooltipVisible = true;

        setTimeout(() => {
            if (this.tooltip && this.tooltip.nativeElement) {
                const tooltip = this.tooltip.nativeElement;
                const { clientX, clientY } = event;

                tooltip.classList.add('visible');
                tooltip.style.position = 'fixed';
                tooltip.style.top = `${clientY + -30}px`;
                tooltip.style.left = `${clientX + 10}px`;
            }
        });
    }
    /*************  ✨ Codeium Command ⭐  *************/
    /**
     * Returns the CSS class associated with a given status.
     * 
     * @param status - The status string to find the corresponding CSS class for.
     * @returns The CSS class string if a match is found; otherwise, an empty string.
     */

    /******  5c0f13e2-f3ff-4074-919a-538c5dadf28e  *******/
    getStatusColor(status: string): string {
        const match = this.statuses.find(item => item.val === status);
        return match ? match.class : '';
    }
    getStatusTitle(status: string): string {
        const match = this.statuses.find(item => item.val === status);
        return match ? match.title : '';
    }
}