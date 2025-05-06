import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { env } from '../../../environments/environment';
import { OrderService } from '../../services/orders.service';
import { CompaniesService } from "../../services/companies.service";
import { LocalStorageService } from '../../services/localstorage.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, Subject, switchMap } from 'rxjs';
import dayjs from 'dayjs';
import { normalizeDateFilters } from '../../directive/filter-utils';

@Component({
  selector: 'orders',
  templateUrl: './data.html'
})
export class OrdersComponent implements OnInit {
  @ViewChild('datePicker') datePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  constructor(
    private DataApi: OrderService,
    private CompanyApi: CompaniesService,
    private localStorage: LocalStorageService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdRef: ChangeDetectorRef
  ) { }
  loadingPage: boolean;
  siteUrl: any;
  curLang: any;
  currentUser: any;
  currentStatus: any;
  loading: any;
  dataItems: any;
  statuses = [
    { val: 'Завершен', title: 'orders.completed', count: 0, color: 'badge-success', checked: false },
    { val: 'Активен', title: 'orders.active', count: 0, color: 'badge-warning', checked: false },
    { val: 'План', title: 'orders.planned', count: 0, color: 'badge-planned', checked: false },
    { val: 'Аннулировано', title: 'orders.cancelled', count: 0, color: 'badge-danger', checked: false },
  ];
  total: any;
  filter: any;
  showFilters = true;
  alertShow: boolean = false;
  columns = [];
  private filtersSubject = new Subject<{ [key: string]: string }>();
  selectedDate: Date | null = null;
  selectedItems: any[] = [];
  allSelected: boolean = false;
  selectedDateRange: any;
  expandedRow: number | null = null;
  isSortModalOpen = false;
  showProductModal = false;
  filterModal = false;
  selectedProducts: any[] = [];
  companies: any[] = [];
  activeTabIndex = 0
  pageParams = {
    total: 0,
    from: 0,
    to: 0,
    current_page: 1,
    last_page: 1,
  };
  ngOnInit() {
    this.siteUrl = env.apiUrl;
    this.curLang = this.localStorage.getItem('curLang');
    this.currentUser = JSON.parse(decodeURIComponent(escape(atob(this.localStorage.getItem('SD')))));
    this.getFilter();
    this.filtersSubject.pipe(
      debounceTime(500),
      switchMap((filters) => {
        return this.searchData(filters);
      })
    ).subscribe();
    const storedColumnsJson = this.localStorage.getItem('columns');
    if (storedColumnsJson) {
      this.columns = JSON.parse(storedColumnsJson);
    } else {
      this.columns = this.getDefaultColumns();
      this.localStorage.setItem('columns', JSON.stringify(this.columns));
    }
    this.updateColumnsIfNeeded();

    const storedPerPage = this.localStorage.getItem('per_page');
    this.filter.per_page = storedPerPage ? parseInt(storedPerPage, 10) : 30;

    this.CompanyApi.getCompanies().subscribe((res:any) => {
      if (res) {
        this.companies = res;
      }
    })

    this.getInvoicesCounts();
  }
  getDefaultColumns() {
    return [
      { key: 'num', label: 'orders.num', visible: true, sort: false },
      { key: 'status', label: 'status', visible: false, sort: false },
      { key: 'ship_date', label: 'orders.ship_date', visible: true, sort: true },
      { key: 'customer', label: 'orders.customer', visible: true, sort: false },
      { key: 'tovar', label: 'orders.tovar', visible: true, sort: false },
      { key: 'tamojni', label: 'orders.tamojni', visible: false, sort: false },
      { key: 'num_contr', label: 'orders.num_contr', visible: true, sort: true },
      { key: 'num_contr_date', label: 'orders.num_contr_date', visible: false, sort: false },
      { key: 'ord_num', label: 'orders.ord_num', visible: true, sort: true },
      { key: 'ord_date', label: 'orders.ord_date', visible: false, sort: true },
      { key: 'transport_kind', label: 'orders.transport_kind', visible: true, sort: false },
      { key: 'transport_number', label: 'orders.transport_number', visible: true, sort: false },
      { key: 'driver_info', label: 'orders.driver_info', visible: true, sort: false },
      { key: 'bord_cross', label: 'orders.bord_cross', visible: false, sort: false },
      { key: 'sts_curr', label: 'orders.sts_curr', visible: true, sort: false },
      { key: 'svx_d', label: 'orders.svx_d', visible: true, sort: true },
      { key: 'unload_d', label: 'orders.unload_d', visible: true, sort: true },
      { key: 'simple_carr', label: 'orders.simple_carr', visible: true, sort: false },
      { key: 'prepay', label: 'orders.prepay', visible: true, sort: false },
      { key: 'dept', label: 'orders.dept', visible: true, sort: true },
      { key: 'schet', label: 'orders.schet', visible: true, sort: false },
      { key: 'meesages', label: 'meesages', visible: true, sort: false },
      { key: 'tasks', label: 'tasks', visible: true, sort: false },
      { key: 'documents', label: 'sidebar.documents', visible: true, sort: false },
    ];
  }
  updateColumnsIfNeeded() {
    const defaultColumns = this.getDefaultColumns();
    const currentColumns = this.columns;
    const isDifferent = defaultColumns.some(defaultColumn => {
      const currentColumn = currentColumns.find(col => col.key === defaultColumn.key);
      return !currentColumn || currentColumn.label !== defaultColumn.label;
    });
    if (isDifferent) {
      this.columns = defaultColumns;
      this.localStorage.setItem('columns', JSON.stringify(this.columns));
    }
  }
  getInvoicesCounts() {
    this.DataApi.invoicesCount().subscribe((res: any) => {
      if (res && res.count) {
        this.total = res.count.total;
        this.statuses = this.statuses.map(status => {
          const countKey = this.getCountKeyForStatus(status.val);
          return {
            ...status, count: res.count[countKey] || 0
          };
        });
      }
    });
  }

  getCountKeyForStatus(val: string): string {
    switch (val) {
      case 'Завершен': return 'finished';
      case 'Активен': return 'active';
      case 'План': return 'plan';
      case 'Аннулировано': return 'canceled';
      default: return '';
    }
  }

  selectTab(index: number) {
    this.activeTabIndex = index;
  }
  openProductModal(products: any[]) {
    if (products.length === 0) {
      return;
    }
    this.selectedProducts = products;
    this.showProductModal = true;
  }
  openFilterModal() {
    this.filterModal = true;
  }
  toggleSortModal(): void {
    this.isSortModalOpen = !this.isSortModalOpen;
  }
  setSort(columnKey: string, direction: 'asc' | 'desc'): void {
    if (this.filter.sort_type === columnKey && this.filter.sort === direction) {
      this.filter.sort_type = '';
      this.filter.sort = '';
    } else {
      this.filter.sort_type = columnKey;
      this.filter.sort = direction;
    }
    this.filter.page = 1;
    this.getDataItem();
    this.isSortModalOpen = false;
  }
  closeSortModal() {
    this.isSortModalOpen = false;
  }
  getDataItem() {
    this.loadingPage = true;
    this.route.queryParamMap.subscribe((data: any) => {
      if (data.params.page)
        this.getInvoices(data.params.page);
      else
        this.getInvoices(1);
    });
  }
  getInvoices(currentPage) {
    this.loadingPage = true;
    this.dataItems = [];
    this.filter.page = currentPage;
    this.filter = normalizeDateFilters(this.filter);
    this.DataApi.getInvoice(this.filter).subscribe((res: any) => {
      if (res) {
        this.filterModal = false;
        this.dataItems = res.result.data;
        this.loadingPage = false;
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
  pageChanged(page) {
    page = Number(page)
    this.loadingPage = true;
    this.router.navigate(['/orders'], { queryParams: { page: page } });
  }
  get isAllStatusesUnchecked(): boolean {
    return this.statuses.every(status => !status.checked);
  }

  selectedStatus(item) {
    if (item.val === 'Все') {
      this.statuses.forEach(status => (status.checked = false));
      this.filter.status_list = [];
    } else {
      item.checked = !item.checked;
      const allChecked = this.statuses.every(status => status.checked);
      if (allChecked) {
        this.statuses.forEach(status => (status.checked = false));
        this.filter.status_list = [];
      } else {
        this.filter.status_list = this.statuses
          .filter(status => status.checked)
          .map(status => status.val);
      }
    }

    this.getInvoices(this.pageParams.current_page);
  }

  getFilter() {
    this.filter = {
      per_page: 30,
      status: '',
      status_list: [],
      ship_date: null
    }
  }
  clearDate() {
    this.selectedDateRange = ''
    this.filter.from_date = ''
    this.filter.to_date = '';
    this.getInvoices(this.pageParams.current_page);
  }
  closeAlert() {
    this.alertShow = false;
    this.showProductModal = false;
    this.selectedProducts = [];
    this.filterModal = false;
  }
  setColumns() {
    this.alertShow = false;
    this.toastr.success('Успешно обновлено');
    this.localStorage.setItem('columns', JSON.stringify(this.columns));
  }
  getVisibleColumns() {
    return this.columns.filter(column => column.visible);
  }
  onSearchChange(filterKey: string, searchTerm: string) {
    this.filter[filterKey] = searchTerm.trim();
    this.filtersSubject.next({ ...this.filter });
  }
  searchData(filters: { [key: string]: string }) {
    this.filter.page = 1;
    this.getDataItem();
    return [];
  }
  clearInput(filterKey: string) {
    this.filter[filterKey] = null;
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
    this.getInvoices(1);
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
  isColumnVisible(key: string): boolean {
    const column = this.columns.find(col => col.key === key);
    return column ? column.visible : false;
  }
  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.pageParams.last_page) return;

    this.pageParams.current_page = newPage;
    this.getInvoices(newPage);
  }
  updatePageSize(perPage: number) {
    this.localStorage.setItem('per_page', perPage);
    this.filter.per_page = perPage;
    this.filter = normalizeDateFilters(this.filter);
    this.getInvoices(1);
  }
  toggleRowExpansion(rowIndex: number): void {
    this.expandedRow = this.expandedRow === rowIndex ? null : rowIndex;
  }
  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastr.success(this.translate.instant('text_copied'))
      })
  }
  resetFilter() {
    this.filter = {
      per_page: 30,
      status: '',
      status_list: []
    }
    this.selectedStatus({ val: 'Все' });
    this.getInvoices(1);
  }

}