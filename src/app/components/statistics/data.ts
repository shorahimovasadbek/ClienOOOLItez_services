import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Chart } from 'chart.js/auto';
import { StatisticsService } from "../../services/statistics.service";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

@Component({
  selector: 'statistics',
  templateUrl: './data.html'
})
export class StatisticsComponent implements OnInit {
  @ViewChild('ordersChart') ordersChart!: ElementRef;
  @ViewChild('financeChart') financeChart!: ElementRef;
  @ViewChild('tasksChart') tasksChart!: ElementRef;
  @ViewChild('requestsChart') requestsChart!: ElementRef;
  @ViewChildren('diagramRef') diagramRefs!: QueryList<ElementRef>;

  loading = false;
  chartInstances: { [key: string]: Chart } = {};
  loadingPage: boolean = true;
  invoiceValues: any;
  financesValues: any;
  tasksValues: any;
  requestsValues: any;
  customers = [];
  filter: any;
  years: number[] = [];
  months = [
    { id: 1, label: 'January' },
    { id: 2, label: 'February' },
    { id: 3, label: 'March' },
    { id: 4, label: 'April' },
    { id: 5, label: 'May' },
    { id: 6, label: 'June' },
    { id: 7, label: 'July' },
    { id: 8, label: 'August' },
    { id: 9, label: 'September' },
    { id: 10, label: 'October' },
    { id: 11, label: 'November' },
    { id: 12, label: 'December' }
  ];
  labels: string[] = [];
  private readonly barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      x: { stacked: false },
      y: {
        stacked: false,
        ticks: {
          stepSize: 1,
          callback: function (value: number) {
            if (Number.isInteger(value)) {
              return value;
            }
            return null;
          }
        }
      }
    }
  };

  constructor(
    private dataApi: StatisticsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 2020; i--) {
      this.years.push(i);
    }
    this.filter = { period: 'monthly', year: currentYear, month: null, customer: '' };
    this.route.queryParams.subscribe((params: any) => {
      if (params && params.customer) {
        this.filter.customer = params.customer;
      }
      else {
        this.filter.customer = '';
      }
    });

  }

  ngAfterViewInit() {
    this.getDataItems();
  }

  getDataItems() {
    this.loadingPage = true;
    this.dataApi.getAll(this.filter).subscribe((res: any) => {
      if (res) {
        this.labels = res.periods;
        this.invoiceValues = res.data.invoices;
        this.financesValues = res.data.finances;
        this.tasksValues = res.data.tasks;
        this.requestsValues = res.data.requests;
        this.customers = res.customers;
        this.loadingPage = false;
        this.createChart('ordersChart', this.ordersChart, 'bar', this.invoiceValues.values);
        this.createChart('financeChart', this.financeChart, 'bar', this.financesValues.values);
        //this.createChart('tasksChart', this.tasksChart, 'bar', this.tasksValues.values);
        //this.createRequestChart();
      }
    }, err => {
      this.loadingPage = false;
    });
  }

  setActiveButton(button: string) {
    this.filter.period = button;
    this.filter.month = button === 'monthly' ? null : this.filter.month;
    this.filter.week = button === 'daily' || button === 'weekly' ? null : this.filter.week;
    this.getDataItems();
  }

  private createChart(chartName: string, chartElement: ElementRef, type: any, data: any) {
    if (this.chartInstances[chartName]) {
      this.chartInstances[chartName].destroy();
    }

    this.chartInstances[chartName] = new Chart(chartElement.nativeElement, {
      type: type,
      data: {
        labels: this.labels,
        datasets: data.map(dataset => ({
          ...dataset,
          stack: undefined
        }))
      },
      options: this.barChartOptions
    });
  }

  private createRequestChart() {
    if (this.chartInstances['requestsChart']) {
      this.chartInstances['requestsChart'].destroy();
    }

    this.chartInstances['requestsChart'] = new Chart(this.requestsChart.nativeElement, {
      type: 'pie',
      data: {
        labels: ['В обработке', 'Одобрено', 'Отклонены'],
        datasets: [{
          data: [this.requestsValues.total_pending, this.requestsValues.total_confirmed, this.requestsValues.total_cancelled],
          backgroundColor: ['#42A5F5', '#66BB6A', '#FBC02D'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 10
        },
        plugins: {
          legend: {
            display: false,
            position: 'bottom'
          }
        }
      }
    });
  }

  async downloadAllChartsAsPdfZip(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
  
    const zip = new JSZip();
    const titles = ['Заказы', 'Финансы', 'Задачи', 'Запросы'];
    const diagramElements = this.diagramRefs.toArray();
  
    const companyName = this.filter.customer || 'Без названия';
    const year = this.filter.year;
    const month = this.filter.month ? String(this.filter.month).padStart(2, '0') : null;
  
    let dateString = '';
    switch (this.filter.period) {
      case 'monthly':
        dateString = month ? `${year}.${month}` : `${year}`;
        break;
      case 'weekly':
        dateString = `${year}_week`;
        break;
      default:
        dateString = `${year}`;
    }
  
    for (let i = 0; i < diagramElements.length; i++) {
      const el = diagramElements[i].nativeElement;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
  
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
  
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
  
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const imageStartY = 25;
      pdf.addImage(imgData, 'PNG', 0, imageStartY, pdfWidth, imgHeight);
  
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(dateString, 10, pageHeight - 10);
  
      const pdfBlob = pdf.output('blob');
  
      const title = titles[i] || `Chart-${i + 1}`;
      const filename = `${title}_(${companyName})_(${dateString}).pdf`;
  
      zip.file(filename, pdfBlob);
    }
  
    const zipName = `${companyName} (${dateString}).zip`;
    const zipContent = await zip.generateAsync({ type: 'blob' });
    saveAs(zipContent, zipName);
  
    this.loading = false;
  }
  

}


@Component({
  selector: 'statistics-detail',
  templateUrl: './detail.html'
})
export class StatisticsDetailComponent implements OnInit {
  @ViewChild('invoiceChart') invoiceChart!: ElementRef;
  @ViewChild('financeChart') financeChart!: ElementRef;
  @ViewChild('tasksChart') tasksChart!: ElementRef;
  @ViewChild('requestsChart') requestsChart!: ElementRef;
  invoiceChartInstance
  financeChartInstance
  tasksChartInstance
  invoiceValues
  financeValues
  tasksValues

  loading = false;
  loadingPage = false;
  type = '';
  filter
  selectedCustomer
  selectedCurrency = 'UZS';
  years: number[] = [];
  months = [
    { id: 1, label: 'January' },
    { id: 2, label: 'February' },
    { id: 3, label: 'March' },
    { id: 4, label: 'April' },
    { id: 5, label: 'May' },
    { id: 6, label: 'June' },
    { id: 7, label: 'July' },
    { id: 8, label: 'August' },
    { id: 9, label: 'September' },
    { id: 10, label: 'October' },
    { id: 11, label: 'November' },
    { id: 12, label: 'December' }
  ];
  customers = [];
  labels = [];
  currencies = [];

  constructor(
    private route: ActivatedRoute,
    private dataApi: StatisticsService
  ) {
    this.type = this.route.snapshot.paramMap.get('type');
  }

  ngOnInit(): void {
    this.filter = { period: 'monthly', year: new Date().getFullYear(), month: null, customer: '' };
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 2020; i--) {
      this.years.push(i);
    }
    this.selectedCustomer = 'Все компании';
    this.getData();
    if (this.type == 'finance') {
      this.filter.currency = "so`m";
    }
  }
  getData() {
    this.loadingPage = true;
    this.dataApi.getInvoicesStat(this.filter, this.setEndpoint()).subscribe((res: any) => {
      if (res) {
        this.labels = res.periods;
        if (this.type == 'orders') {
          this.customers = res.customers;
          this.customers.unshift('Все компании');
          this.invoiceValues = res.data;
          this.createInvoiceChart();
        }
        if (this.type == 'finance') {
          this.customers = res.customers;
          this.customers.unshift('Все компании');
          this.currencies = res.currencies;
          this.financeValues = res.data;
          this.createFinanceChart();
        }
        if (this.type == 'task') {
          this.tasksValues = res.data;
          this.createTasksChart();
        }
        this.loadingPage = false;

      }
    }, err => {
      this.loadingPage = false;
    })
  }
  private createInvoiceChart() {
    if (this.invoiceChartInstance) {
      this.invoiceChartInstance.destroy();
    }
    this.invoiceChartInstance = new Chart(this.invoiceChart.nativeElement, {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: this.invoiceValues.values
      },
      options: {
        scales: {
          x: { stacked: true },
          y: {
            stacked: false,
            ticks: {
              stepSize: 1,
              callback: function (value: number) {
                if (Number.isInteger(value)) {
                  return value;
                }
                return null;
              }
            }
          }
        }
      },
    });
  }
  private createFinanceChart() {
    if (this.financeChartInstance) {
      this.financeChartInstance.destroy();
    }
    this.financeChartInstance = new Chart(this.financeChart.nativeElement, {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: this.financeValues.values.map(dataset => ({
          ...dataset,
          stack: undefined
        }))
      },
      options: {
        scales: {
          x: {
            stacked: false,
            beginAtZero: true
          },
          y: {
            stacked: false,
            beginAtZero: true
          }
        }
      },
    });
  }
  private createTasksChart() {
    if (this.tasksChartInstance) {
      this.tasksChartInstance.destroy();
    }
    this.tasksChartInstance = new Chart(this.tasksChart.nativeElement, {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: this.tasksValues.values
      },
      options: {
        scales: {
          x: { stacked: true },
          y: {
            stacked: false,
            ticks: {
              stepSize: 1,
              callback: function (value: number) {
                if (Number.isInteger(value)) {
                  return value;
                }
                return null;
              }
            }
          }
        }
      },
    });
  }
  setActiveButton(button: string) {
    this.filter.period = button;
    this.filter.month = button === 'monthly' ? null : this.filter.month;
    this.filter.week = button === 'daily' || button === 'weekly' ? null : this.filter.week;
    this.getData();
  }
  setCurrency(currency) {
    this.selectedCurrency = currency.title;
    this.filter.currency = currency.value;
    this.getData();
  }
  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.filter.customer = customer == 'Все компании' ? '' : customer;
    this.getData();
  }
  setEndpoint() {
    let endPoint;
    switch (this.type) {
      case 'orders':
        return endPoint = 'invoices';
        break;
      case 'finance':
        return endPoint = 'finances';
        break;
      case 'task':
        return endPoint = 'tasks';
        break;
      default:
        return endPoint = '';
    }
  }
  downloadPdf() {
    const element = document.querySelector('.statistics-detail') as HTMLElement;

    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(
        this.selectedCustomer +
        ' (' +
        this.filter.year +
        (this.filter.month ? '.' + String(this.filter.month).padStart(2, '0') : '') +
        ').pdf'
      );
    });
  }
  print() {
    const element = document.querySelector('.statistics-detail') as HTMLElement;

    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    });
  }
}