import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { LocalStorageService } from "../../services/localstorage.service";
import { FinanceService } from "../../services/finance.service";
import dayjs from "dayjs";
import { normalizeDateFilters } from "../../directive/filter-utils";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'finance',
  templateUrl: './data.html'
})
export class FinanceComponent implements OnInit {
  dataItems = []
  isAllStatusesUnchecked
  filter
  selectedDateRange
  balances
  showFilters = false;
  loadingPage = false;
  allSelected
  selectedItems = []
  loading = false
  filterModal = false;
  statuses = [
    { val: 'Все заказы', title: 'Все заказы', checked: true },
    { val: 'Активные', title: 'Активные', checked: false },
    { val: 'Завершенные', title: 'Завершенные', checked: false },
  ]
  transactions = [
    { val: 'Все транзакции', title: 'Все транзакции', checked: true },
    { val: 'Задолженности', title: 'Задолженности', checked: false }
  ]
  pageParams = {
    total: 0,
    from: 0,
    to: 0,
    current_page: 1,
    last_page: 1,
  };
  expandedRow: number | null = null;
  constructor(
    private DataApi: FinanceService,
    private localStorage: LocalStorageService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }
  ngOnInit() {
    this.getFilter();
    this.getDataItemsSum();
    const storedPerPage = this.localStorage.getItem('per_page');
    this.filter = {
      per_page: 30,
      page: 1
    }
    this.filter.per_page = storedPerPage ? +storedPerPage : 30;
  }
  getDataItems() {
    this.loadingPage = true;
    this.filter = normalizeDateFilters(this.filter);
    this.DataApi.getFinance(this.filter).subscribe((res: any) => {
      if (res && res.status === 'success') {
        this.loadingPage = false;
        this.filterModal = false;
        this.dataItems = res.result.data;
        this.pageParams = {
          total: res.result.total,
          from: (res.result.current_page - 1) * res.result.per_page + 1,
          to: Math.min(res.result.current_page * res.result.per_page, res.result.total),
          current_page: res.result.current_page,
          last_page: res.result.last_page,
        };
      }
    }, err => {
      this.loadingPage = false;
    })
  }
  getDataItemsSum() {
    this.DataApi.getFinanceSum().subscribe((res: any) => {
      if (res && res.status) {
        this.balances = res;
      }
    })
  }
  selectedStatus(selectedItem: any): void {
    this.transactions.forEach(item => {
      item.checked = item === selectedItem;
    });

    if (selectedItem.val === 'Все транзакции') {
      this.filter.dept = '';
    } else if (selectedItem.val === 'Задолженности') {
      this.filter.dept = 'yes';
    }
    this.getDataItems();
  }
  updateStatus(selectedStatus: any): void {
    this.statuses.forEach(status => status.checked = false);
    selectedStatus.checked = true;
    this.filter.status_list = selectedStatus.val === 'Все заказы' ? [] : [selectedStatus.val];
    this.getDataItems();
  }

  getFilter() {
    this.filter = {
      per_page: 30,
      status: '',
      status_list: []
    }
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
    this.selectedDateRange = ''
    this.filter.from_date = ''
    this.filter.to_date = '';
    // this.getInvoices(this.pageParams.current_page);
  }
  updatePageSize(perPage: number) {
    this.localStorage.setItem('per_page', perPage);
    this.filter.per_page = perPage;
    this.filter = normalizeDateFilters(this.filter);
    this.getDataItems();
  }
  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.pageParams.last_page) {
      this.filter.page = newPage;
      this.getDataItems();
    }
  }
  toggleAllSelection(): void {
    this.allSelected = !this.allSelected;

    if (this.allSelected) {
      this.selectedItems = this.dataItems.map(item => item.id);
      this.dataItems.forEach(item => item.selected = true);
    } else {
      this.selectedItems = [];
      this.dataItems.forEach(item => item.selected = false);
    }
  }
  exportData() {
    this.loading = true;
    if (this.selectedItems.length == 0) {
      this.toastr.error(this.translate.instant('choose_value'));
    }
    if (this.selectedItems.length !== 0) {
      this.DataApi.exportData(this.selectedItems).subscribe((res: any) => {
        if (res) {
          const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = new Date().getTime() + '_documents.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
        }
        this.selectedItems = [];
        this.dataItems.forEach(val => {
          val.selected = false;
        });

        this.loading = false;
      });
    }
  }
  onCheckboxChange(item: any): void {
    if (item.selected) {
      this.selectedItems.push(item.id);
    } else {
      const index = this.selectedItems.indexOf(item.id);
      if (index !== -1) {
        this.selectedItems.splice(index, 1);
      }
    }
    this.allSelected = this.dataItems.every(item => item.selected);
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
      per_page: +this.localStorage.getItem('per_page') || 30,
      status: null,
      num: null,
      num_contr: null,
      ord_num: null,
      date: null,
      ship_date: null
    };
    this.selectedDateRange = null;
    this.updateStatus({ val: 'Все заказы' });
  }

  toggleRowExpansion(rowIndex: number): void {
    this.expandedRow = this.expandedRow === rowIndex ? null : rowIndex;
  }
}