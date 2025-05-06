import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { LocalStorageService } from "../../services/localstorage.service";
import { RequestsService } from "../../services/requests.service";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { Socket } from "ngx-socket-io";
import { env } from "../../../environments/environment";
import { UploadService } from "../../services/upload.service";

@Component({
    selector: 'requests',
    templateUrl: './data.html'
})
export class RequestsComponent implements OnInit {
    dataItems
    data = { title: '', product: '', id: null, status: 'new' };
    loadingPage = false;
    requestModal = false;
    deleteConfirmModal = false;
    loading = false;
    filter: any;
    pageParams = {
        total: 0,
        from: 0,
        to: 0,
        current_page: 1,
        last_page: 1,
    };

    statuses = [
        { title: 'Старые', val: 'old', checked: false },
        { title: 'Архив', val: 'archive', checked: false }
    ];
    constructor(
        private localStorage: LocalStorageService,
        private DataApi: RequestsService,
        private translate: TranslateService,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this.filter = { page: 1, per_page: 30, status: 'new' };
        this.getDataItems();
    }
    getDataItems() {
        this.loadingPage = true;
        this.DataApi.getRequests(this.filter).subscribe((res: any) => {
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
    postRequest() {
        this.loading = true;
        const request$ = this.data.id
            ? this.DataApi.putRequest(this.data)
            : this.DataApi.postRequest(this.data);
        request$.subscribe(
            (res: any) => {
                if (res && res.success) {
                    this.loading = false;
                    this.closeAlert();
                    this.getDataItems();
                    this.toastr.success(this.translate.instant('success_saved'));
                }
            },
            (err) => {
                this.loading = false;
            }
        );

    }
    showUpdateModal(item) {
        this.data = item;
        this.requestModal = true;
    }
    showDeleteConfirm(item) {
        event.stopPropagation();
        this.data = item;
        this.deleteConfirmModal = true;
    }
    deleteRequest() {
        this.loading = true;
        this.DataApi.deleteRequest(this.data.id).subscribe((res: any) => {
            if (res && res.success) {
                this.loading = false;
                this.closeAlert();
                this.getDataItems();
                this.toastr.success(res.message);
            }
        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        })
        this.closeAlert();
        this.data = { title: '', product: '', id: null, status: 'new' };
    }
    selectedStatus(selectedItem) {
        this.statuses.forEach(item => (item.checked = false));
        selectedItem.checked = true;
        this.filter.status = selectedItem.val;
        this.getDataItems();
    }
    anyChecked(): boolean {
        return this.statuses.some(item => item.checked);
    }
    closeAlert() {
        this.requestModal = false;
        this.deleteConfirmModal = false;
        this.data = { title: '', product: '', id: null, status: 'new' };
    }
    updatePageSize(perPage: number) {
        this.localStorage.setItem('per_page', perPage);
        this.filter.per_page = perPage;
        this.getDataItems();
    }
    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.pageParams.last_page) {
            this.filter.page = newPage;
            this.getDataItems();
        }
    }
}

@Component({
    selector: 'requests-edit',
    templateUrl: './edit.html'
})
export class RequestsEditComponent implements OnInit {
    @ViewChild('messageList') messageList!: ElementRef;
    @ViewChild('fileInput') fileInput: ElementRef;

    loadingPage = false;
    data
    messages = [];
    message: any;
    inputText
    messagesData: any = [];
    updateMessageModal = false;
    selectedMessage
    currentUser: any;
    disable_loaded: boolean;
    siteUrl = env.apiUrl;
    uploadFiles = []
    constructor(
        private localStorage: LocalStorageService,
        private DataApi: RequestsService,
        private router: ActivatedRoute,
        private socket: Socket,
        private toastr: ToastrService,
        private translate: TranslateService,
        private UploadApi: UploadService
    ) { }

    ngOnInit(): void {
        this.message = { item_id: '', msg: '', file: '', uuid: '' }
        this.currentUser = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem('SD')))));
        this.loadingPage = true;
        this.loadSocket();
        this.getRequest();
    }

    getRequest() {
        this.loadingPage = true;
        this.DataApi.getRequestById(this.router.snapshot.paramMap.get('id')).subscribe((res: any) => {
            if (res && res.success) {
                this.data = res.result;
                this.messages = res.messages;
                this.loadingPage = false;
                setTimeout(() => {
                    this.scrollBottom();
                }, 100);
            }
        }, err => {
            this.loadingPage = false;
        })
    }
    
    createMessage(data) {
        this.messages.push(data);
        this.scrollBottom();
        this.inputText = '';
        this.message = { item_id: data.item_id, msg: '', file: '' };
        this.socket.emit('request-message', { action: 'sent', data: data });
        this.DataApi.createMessage(data).subscribe();
    }
    getDate(date) {
        var d = new Date(date);
        var dd = ("0" + d.getDate()).slice(-2);
        var mm = ("0" + (d.getMonth() + 1)).slice(-2);
        var yyyy = d.getFullYear();
        return yyyy + '-' + mm + '-' + dd;
    }
    groupByMessages(messages) {
        const groupedCollection = messages.reduce((previous, current) => {
            current['date'] = current['creat_at'];
            if (!previous[current['date']])
                previous[current['date']] = [current];
            else
                previous[current['date']].push(current);

            return previous;
        }, {});

        return Object.keys(groupedCollection).map(key => ({ key, value: groupedCollection[key] }));
    }
    getTime(date) {
        var d = new Date(date);
        var time = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        return time;
    }
    generateUUID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    loadSocket() {
        this.DataApi.requestMessageSocket().subscribe((res: any) => {
            if (res) {
                if (res.action == 'sent' && res.data && res.data.user) {
                    this.messages.push(res.data);
                    this.showNotification(res.data);
                }
                if (res.action == 'sent' && res.data) {
                    this.messages.forEach((item: any) => {
                        if (item.id == res.data.item_id)
                            item.messages_count += 1;
                    })
                }
                if (res.action == 'delete' && res.data && res.data.user) {
                    if (this.messages && this.messages.length > 0) {
                        var index = this.messages.findIndex(i => i.uuid == res.data.uuid);
                        this.messages.splice(index, 1);
                    }
                }
                if (res.action == 'delete' && res.data) {
                    this.messages.forEach((item: any) => {
                        if (item.id == res.data.item_id)
                            item.messages_count -= 1;
                    })
                }
            }
        })
        this.scrollBottom();
    }
    deleteMessage(uuid) {
        this.DataApi.deleteMessage(uuid).subscribe((res: any) => {
            if (res) {
                this.toastr.success(this.translate.instant('success_deleted'));
                this.messages = this.messages.filter(m => m.uuid !== uuid);
            }
        })
    }
    showUpdate(message: any) {
        this.updateMessageModal = true;
        this.selectedMessage = { ...message }
        this.inputText = this.selectedMessage.msg;
    }
    updateMessage() {
        this.selectedMessage.msg = this.inputText;
        this.DataApi.putMessage(this.selectedMessage).subscribe((res: any) => {
            if (res) {
                this.toastr.success(this.translate.instant('success_updated'));
                this.updateMessageModal = false;
                this.inputText = '';
                this.getRequest();
            }
        });
    }
    cancelEdit() {
        this.updateMessageModal = false;
        this.inputText = '';
        this.selectedMessage = { item_id: null, msg: '', file: '' };
    }
    sendMessage() {
        let sendData = {
            item_id: this.data.id,
            created_at: new Date(),
            client: { fullname: this.currentUser.name, photo: this.currentUser.photo },
            client_id: this.currentUser.id,
            msg_time: new Date().getTime(),
            msg: this.inputText,
            file: this.message.file,
            uuid: this.generateUUID()
        };
        this.createMessage(sendData);
    }
    uploadFile(event) {
        let images = [];
        let files = [];
        if (event.target.files && event.target.files.length > 0) {
            if (event.target.files[0].type == 'image/jpg' || event.target.files[0].type == 'image/jpeg' || event.target.files[0].type == 'image/png') {
                this.loadingPage = true;
                this.UploadApi.filePreview(event.target.files).subscribe((res: any) => {
                    if (res) {
                        files.push(res[0].files);
                        images.push(res[0].images);
                    }
                });
            } else
                this.toastr.error('Неверный формат файла', 'danger');
        }
        setTimeout(() => {
            if (files.length > 0) {
                files.forEach((file: any) => {
                    if (file[0])
                        this.uploadFiles.push({ file: file[0], type: 'requests' });
                })
                var apiUrl = env.apiUrl + '/api/file';
                this.UploadApi.fileUpload(apiUrl, 'requests', this.uploadFiles).subscribe((data: any) => {
                    if (data.status == 'success') {
                        data.data.forEach((item: any) => {
                            this.message.file = '/uploads/requests/' + item.file;
                            this.loadingPage = false;
                        });

                        var sendData = {
                            item_id: this.data.id,
                            msg: 'Фото сообщение',
                            file: this.message.file,
                            client_id: this.currentUser.id,
                            client: { fullname: this.currentUser.name, photo: this.currentUser.photo },
                            creat_at: this.getDate(new Date()),
                            created_at: new Date(),
                            uuid: this.generateUUID(),
                        };

                        this.createMessage(sendData);

                        this.uploadFiles = [];
                        if (<HTMLInputElement>document.getElementById("uploadFile"))
                            (<HTMLInputElement>document.getElementById("uploadFile")).value = '';
                    }
                }, error => {
                    this.loadingPage = false;
                });
            }
        }, 500);
    }
    triggerFileInput() {
        this.fileInput.nativeElement.click();
    }
    private scrollBottom() {
        if (this.messageList) {
            setTimeout(() => {
                this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
            }, 50);
        }
    }
    showNotification(data: any) {
        if (Notification.permission === 'granted') {
            new Notification(`Новое сообщение от ${data.user.fullname}`, {
                body: data.msg || 'У вас новое сообщение!',
                icon: '/assets/images/logo.png',
            });
        }
    }
}