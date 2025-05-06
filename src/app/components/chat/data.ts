import { Component, OnInit } from "@angular/core";
import { ChatService } from "../../services/chat.service";
import { LocalStorageService } from "../../services/localstorage.service";
import { ColleaguesService } from "../../services/colleagues.service";
import { FormControl } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'chat',
  templateUrl: './data.html'
})
export class ChatComponent implements OnInit {
  loadingPage = false;
  loading = false;
  filter
  dataItems
  activeButton = 'invoice';
  showAddChatModal = false;
  searchControl = new FormControl('');
  data
  employees = [];
  litez = [];
  pageParams = {
    from: 0,
    to: 0,
    total: 0,
    per_page: 30,
    page: 1,
    current_page: 0,
    last_page: 0
  }
  constructor(
    private DataApi: ChatService,
    private localStorage: LocalStorageService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.pageParams.per_page = +this.localStorage.getItem('per_page') || 30;
    this.filter = { type: 'invoice', search: '' }
    this.data = { title: '', product: '', id: null, type: '', invoice_id: null };
    this.getChats();
    this.findEmployees();
  
  }
  getChats() {
    this.pageParams = { ...this.pageParams, ...this.filter }
    this.loadingPage = true;
    this.DataApi.getChatList(this.pageParams).subscribe((res: any) => {
      if (res) {
        this.loadingPage = false;
        this.pageParams = {
          total: res.total,
          from: (res.current_page - 1) * res.per_page + 1,
          to: Math.min(res.current_page * res.per_page, res.total),
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          page: res.current_page,
        };
        this.dataItems = res.data;
      }
    }, err => {
      this.loadingPage = false;
    })
  }
  findEmployees() {
    this.DataApi.getUsers().subscribe((res: any) => {
      if(res) {
        this.employees = res.result;
        this.litez = res.litez_users;
      }
    })
  }
  postChat() {
    this.loading = true;
    this.DataApi.postChat(this.data).subscribe((res: any) => {
      if(res) {
        this.loading = false;
        this.showAddChatModal = false;
        this.toastr.success(this.translate.instant('success_saved'));
        this.data = { title: '', product: '', id: null, type: '', invoice_id: null };
        this.getChats();
      }
    },err => {
      this.loading = false;
    })
  }
  setActive(button: string) {
    if(this.activeButton === button) return;
    this.activeButton = button;
    this.filter.type = button;
    this.getChats();
  }
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.getChats();
    }
  }
  updatePageSize(perPage: number) {
    this.localStorage.setItem('per_page', perPage);
    this.pageParams.per_page = perPage;
    this.getChats();
  }
  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.pageParams.last_page) {
      this.pageParams.page = newPage;
      this.getChats();
    }
  }
  closeAlert() {
    this.showAddChatModal = false
  }
}