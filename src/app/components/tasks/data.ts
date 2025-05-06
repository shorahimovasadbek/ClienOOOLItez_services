import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { TasksService } from "../../services/tasks.service";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { env } from "../../../environments/environment";
import { FileService } from "../../services/file.service";
import { UploadService } from "../../services/upload.service";
import { ActivatedRoute, Router } from "@angular/router";
import { LocalStorageService } from "../../services/localstorage.service";

@Component({
    selector: 'tasks',
    templateUrl: './data.html'
})
export class TasksComponent implements OnInit {
    @ViewChild('tooltip') tooltip!: ElementRef;
    tooltipVisible = false;
    tooltipData: any[] = [];

    dataItems
    siteUrl = env.apiUrl;
    filter: any;
    showFilters = false;
    loadingPage = false;
    selectedDateRange: any;
    private filtersSubject = new Subject<{ [key: string]: string }>();
    allTasksCount = 0;
    isColleaguesRoute
    pageParams = {
        total: 0,
        from: 0,
        to: 0,
        current_page: 1,
        last_page: 1,
    };
    statuses = [
        { val: 'open', title: 'Открыты', count: 0, color: 'badge', checked: false, class: "open" },
        { val: 'in_work', title: 'В работе', count: 0, color: 'badge-blue', checked: false, class: "working" },
        { val: 'complete', title: 'Выполнены', count: 0, color: 'badge-success', checked: false, class: "task-completed" },
        { val: 'pending', title: 'На рассмотрении', count: 0, color: 'badge-border-success', class: "waiting", checked: false },
        { val: 'cancel', title: 'Отменены', count: 0, color: 'badge-danger', checked: false, class: "canceled" },
    ];
    constructor(
        private DataApi: TasksService,
        private router: Router
    ) {
        this.router.events.subscribe(() => {
            this.isColleaguesRoute = this.router.url.startsWith('/colleagues');
        });
    }
    ngOnInit(): void {
        this.filter = { page: 1, per_page: 30, status_list: [], search: '' };
        this.getDataCounts();
    }

    getDataCounts() {
        this.DataApi.getTaskCounts(this.filter).subscribe((res: any) => {
            if (res && res.count) {
                this.statuses.forEach(status => {
                    if (res.count[status.val] !== undefined) {
                        status.count = res.count[status.val];
                        this.allTasksCount += res.count[status.val];
                    }
                });
            }
        });
    }
    getDataItems() {
        this.loadingPage = true;
        this.DataApi.getTasks(this.filter).subscribe((res: any) => {
            if (res) {
                this.loadingPage = false;
                this.dataItems = res.data;
                this.pageParams = {
                    total: res.total,
                    from: (res.current_page - 1) * res.per_page + 1,
                    to: Math.min(res.current_page * res.per_page, res.total),
                    current_page: res.current_page,
                    last_page: res.last_page,
                };
            }
        }, err => {
            this.loadingPage = false;
        })
    }
    clearDate() {
        this.selectedDateRange = ''
        this.filter.from_date = ''
        this.filter.to_date = '';
        this.getDataItems();
    }
    selectedStatus(item) {
        item.checked = !item.checked;

        this.filter.status_list = [];
        this.statuses.forEach((item: any) => {
            if (item.checked)
                this.filter.status_list.push(item.val);
        })
        this.getDataItems();
    }
    updatePageSize(perPage: number) {
        this.filter.per_page = perPage;
        this.getDataItems();
    }
    changePage(newPage: number) {
        if (newPage < 1 || newPage > this.pageParams.last_page) return;
        this.pageParams.current_page = newPage;
        this.getDataItems();
    }
    clearInput(filterKey: string) {
        this.filter[filterKey] = '';
        this.filtersSubject.next({ ...this.filter });
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
    onKeyUp(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.getDataItems();
        }
    }
    getStatusColor(status: string): string {
        const match = this.statuses.find(item => item.val === status);
        return match ? match.class : '';
    }
    getStatusTitle(status: string): string {
        const match = this.statuses.find(item => item.val === status);
        return match ? match.title : '';
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

    hideTooltip() {
        this.tooltipVisible = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        if (!this.tooltip || !this.tooltip.nativeElement.contains(event.target)) {
            this.hideTooltip();
        }
    }

    @HostListener('document:scroll')
    onDocumentScroll() {
        this.hideTooltip();
    }

    @HostListener('document:contextmenu', ['$event'])
    onContextMenu(event: Event) {
        this.hideTooltip();
    }
}

@Component({
    selector: 'task-edit',
    templateUrl: './edit.html'
})
export class TasksEditComponent implements OnInit {
    invoices: any;
    data: any;
    loading: boolean = false;
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
    siteUrl = env.apiUrl;
    collegues: any[] = [];
    alertShow = false;
    editorConfig = {
        editable: true,
        spellcheck: true,
        height: 'auto',
        minHeight: '5rem',
        maxHeight: 'auto',
        width: 'auto',
        minWidth: '0',
        translate: 'no',
        enableToolbar: true,
        showToolbar: true,
        placeholder: 'Описание задачи',
    };
    statuses = [
        { val: 'open', title: 'Открыты', count: 3, color: 'badge', checked: false },
        { val: 'in_work', title: 'В работе', count: 3, color: 'badge-blue', checked: false },
        { val: 'complete', title: 'Выполнены', count: 4, color: 'badge-success', checked: false },
        { val: 'pending', title: 'На рассмотрении', count: 5, color: 'badge-border-success', checked: false },
        { val: 'cancel', title: 'Отменена', count: 5, color: 'badge-danger', checked: false },
    ];
    backupViewers: number[] = [];
    currentUser: any;
    constructor(
        private taskService: TasksService,
        private translate: TranslateService,
        private toastr: ToastrService,
        private UploadApi: UploadService,
        private router: Router,
        private route: ActivatedRoute,
        private localStorage: LocalStorageService,
        private FileApi: FileService,) { }

    ngOnInit(): void {
        if (this.localStorage.getItem('SD')) {
            this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
        }
        this.data = { title: null, message: null, invoice_id: null, files: [] };
        this.getCollegues();
        setTimeout(() => {
            this.translate.get(['success_updated', 'format_file_incorrect', 'file_removing', 'file_uploading']).subscribe((item: any) => {
                this.success_updated_mes = item['success_updated'];
                this.format_file_incorrect_mes = item['format_file_incorrect'];
                this.file_removing_mes = item['file_removing'];
                this.file_uploading_mes = item['file_uploading'];
            });
        }, 500)
        this.getTask();
    }
    getTask() {
        if (this.route.snapshot.params['id'] == 0) return
        this.loading = true;
        this.taskService.getTask(this.route.snapshot.params['id']).subscribe((res: any) => {
            if (res) {
                this.data = res.result;
                this.invoices = [this.data.invoice];
                this.data.viewers = this.data.viewers.map((item: any) => item.id);
                this.loading = false;
            }
        }, err => {
            this.loading = false;
        })
    }
    getCollegues() {
        this.taskService.getTaskCollegues().subscribe((res: any) => {
            if (res) {
                this.collegues = res.result;
            }
        })
    }
    onSearch(event: any): void {
        const searchText = event.term;
        this.loading = true;
        this.taskService.findInvoice(searchText).subscribe((res: any) => {
            if (res && res.result) {
                this.invoices = res.result;
            } else {
                this.invoices = [];
            }
        }, (error) => {
            this.invoices = [];
        },
            () => {
                this.loading = false;
            }
        );
    }
    removeFile(item: any, index: any) {
        this.uploading = true;
        this.uploadingText = this.translate.instant('file_removing');
        var data = { filename: item.filename, id: 0, type: 'task' }
        this.FileApi.deleteFile(data).subscribe((data: any) => {
            this.uploading = false;
            if (data)
                this.data.files.splice(index, 1);
        }, err => {
            this.uploading = false;
        });
    }

    uploadPhoto(event: any) {
        const validTypes = ['image/jpg', 'image/jpeg', 'image/png', 'application/pdf'];
        this.files = [];
        this.uploadFiles = [];

        if (event.target.files && event.target.files.length > 0) {
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
                    this.uploadFiles.push({ file, type: 'task' });
                });

                const apiUrl = env.apiUrl + '/api/file';
                this.UploadApi.fileUpload(apiUrl, 'task', this.uploadFiles).subscribe(
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
                            if (<HTMLInputElement>document.getElementById("uploadPhotos")) {
                                (<HTMLInputElement>document.getElementById("uploadPhotos")).value = '';
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


    closeAlert() {
        this.data.viewers = [...this.backupViewers];
        this.alertShow = false;
    }
    openAlert() {
        if (this.data.viewers)
            this.backupViewers = [...this.data.viewers];
        this.alertShow = true;
    }
    saveViewers() {
        this.alertShow = false;
    }
    getSelectedViewers() {
        if (!this.data.viewers) return [];
        return this.data.viewers.map((viewerId: number) => {
            return this.collegues.find((collegue) => collegue.id === viewerId);
        }).filter((viewer) => viewer);
    }
    saveTask() {
        this.loading = true;
        if (!this.data.id) {
            this.taskService.postTask(this.data).subscribe((res: any) => {
                if (res) {
                    this.toastr.success(this.translate.instant('success_added'));
                    this.router.navigate(['/tasks']);
                    this.loading = false;
                }
            }, err => {
                this.loading = false;
            })
        }
        else {
            this.taskService.putTask(this.data).subscribe((res: any) => {
                if (res) {
                    this.toastr.success(this.translate.instant('success_updated'));
                    this.router.navigate(['/tasks']);
                    this.loading = false;
                }
            }, err => {
                this.loading = false;
            })
        }

    }

}

@Component({
    selector: 'task-detail',
    templateUrl: './detail.html'
})
export class TasksDetailComponent implements OnInit {
    data: any;
    loading = false;
    siteUrl = env.apiUrl;
    activeTab: string = 'comments';
    comment = { message: null, id: null };
    collegues
    backupViewers
    currentUser
    alertShow = false;
    editMode = {
        title: false,
        invoice_id: false,
        message: false,
    };
    statuses = [
        { val: 'open', title: 'Открыты', count: 3, color: 'badge', checked: false },
        { val: 'in_work', title: 'В работе', count: 3, color: 'badge-blue', checked: false },
        { val: 'complete', title: 'Выполнены', count: 4, color: 'badge-success', checked: false },
        { val: 'pending', title: 'На рассмотрении', count: 5, color: 'badge-border-success', checked: false },
        { val: 'cancel', title: 'Отменена', count: 5, color: 'badge-danger', checked: false },
    ];
    editorConfig = {
        editable: true,
        spellcheck: true,
        height: 'auto',
        minHeight: '5rem',
        maxHeight: 'auto',
        width: 'auto',
        minWidth: '0',
        translate: 'no',
        enableToolbar: true,
        showToolbar: true,
        placeholder: 'Описание задачи',
    };
    invoices
    constructor(
        private taskService: TasksService,
        private route: ActivatedRoute,
        private router: Router,
        private toastr: ToastrService,
        private localStorage: LocalStorageService,
        private translate: TranslateService) { }
    ngOnInit(): void {
        if (this.localStorage.getItem('SD')) {
            this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
        }
        this.getCollegues();
        this.getTask();
    }

    getTask() {
        if (this.route.snapshot.params['id'] == 0) return
        this.loading = true;
        this.taskService.getTask(this.route.snapshot.params['id']).subscribe((res: any) => {
            if (res) {
                this.data = res.result;
                this.data.viewers = this.data.viewers.map((item: any) => item.id);
                this.loading = false;
            }
        }, err => {
            this.loading = false;
        })
    }
    getCollegues() {
        this.taskService.getTaskCollegues().subscribe((res: any) => {
            if (res) {
                this.collegues = res.result;
            }
        })
    }
    addComment() {
        this.loading = true;
        this.comment.id = this.data.id
        this.taskService.addMessage(this.comment).subscribe((res: any) => {
            if (res) {
                this.loading = false;
                this.toastr.success(this.translate.instant('success_saved'));
                this.getTask();
                this.comment = { message: '', id: '' };
            }
        }, err => {
            this.loading = false;
        })
    }
    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
    editTask(field: string) {
        this.editMode[field] = true;
    }
    saveTask(field: string, value: string) {
        this.taskService.patchTask({ id: this.data.id, type: field, value: value }).subscribe((res: any) => {
            if (res) {
                this.toastr.success(this.translate.instant('success_updated'));
                this.getTask();
            }
        })
        this.data[field] = value;
        this.editMode[field] = false;
    }
    cancelEdit(field: string) {
        this.editMode[field] = false;
    }
    saveInvoice(invoiceId: number) {
        this.data.invoice_id = this.invoices.find((invoice) => invoice.id === invoiceId) || null;
        this.saveTask('invoice_id', this.data.invoice_id.id);
        this.editMode.invoice_id = false;
    }
    getStatusTitle(status: string): string {
        const match = this.statuses.find(item => item.val === status);
        return match ? match.title : '';
    }
    closeAlert() {
        this.data.viewers = [...this.backupViewers];
        this.alertShow = false;
    }
    openAlert() {
        if (this.data.viewers)
            this.backupViewers = [...this.data.viewers];
        this.alertShow = true;
    }
    saveViewers() {
        this.alertShow = false;
        this.saveTask('viewers', this.data.viewers);
    }
    getSelectedViewers() {
        if (!this.data.viewers) return [];
        return this.data.viewers.map((viewerId: number) => {
            return this.collegues.find((collegue) => collegue.id === viewerId);
        }).filter((viewer) => viewer);
    }
    onSearch(event: any): void {
        const searchText = event.term;
        this.loading = true;
        this.taskService.findInvoice(searchText).subscribe((res: any) => {
            if (res && res.result) {
                this.invoices = res.result;
            } else {
                this.invoices = [];
            }
        }, (error) => {
            this.invoices = [];
        },
            () => {
                this.loading = false;
            }
        );
    }
}