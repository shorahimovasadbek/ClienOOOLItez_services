import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { AppRoutingModule } from './app-routing.module';

// Custom modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';

// Directive
import { FilterPipe, IsEmptyPipe, TotalPipe, SearchPipe, TimePipe, NumformatPipe, SafeUrlPipe, GroupBy, OrderBy } from './directive/filter';
import { OpenDatepickerDirective } from './directive/open-datepicker.directive';
import { TableScrollDirective } from './directive/table-scroll';

import { TokenInterceptor } from './services/token.interceptor';
// Components
import { AppComponent } from './app.component';
import { HeaderComponent, SidebarComponent } from './components/partials/data';
import { LoginComponent, PageNotFoundComponent } from './components/auth/data';
import { ProfileComponent } from './components/profile/data';
import { OrdersComponent } from './components/orders/data';
import { TicketComponent, TicketDetailComponent } from './components/ticket/data';
import { TasksComponent, TasksDetailComponent, TasksEditComponent } from './components/tasks/data';
import { FinanceComponent } from './components/finance/data';
import { DocumentsComponent, DocumentsOrderDetailComponent } from './components/documents/data';
import { StatisticsComponent, StatisticsDetailComponent } from './components/statistics/data';
import { RequestsComponent, RequestsEditComponent } from './components/requests/data';
import { CompaniesComponent } from './components/companies/data';
import { ColleagueAddComponent, ColleagueDetailComponent, ColleagueProfileComponent, ColleagueTasksComponent, ColleaguesComponent } from './components/colleagues/data';
import { ReviewsComponent } from './components/reviews/data';
import { ChatComponent } from './components/chat/data';


registerLocaleData(localeRu, 'ru-RU');

const config: SocketIoConfig = { url: 'https://socket.litez.uz', options: {} };

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    LoginComponent,
    PageNotFoundComponent,
    ProfileComponent,
    OrdersComponent,
    TicketComponent,
    TicketDetailComponent,
    TasksComponent,
    TasksEditComponent,
    TasksDetailComponent,
    FinanceComponent,
    DocumentsComponent,
    DocumentsOrderDetailComponent,
    StatisticsComponent,
    StatisticsDetailComponent,
    RequestsComponent,
    RequestsEditComponent,
    CompaniesComponent,
    ColleaguesComponent,
    ColleagueDetailComponent,
    ColleagueProfileComponent,
    ColleagueAddComponent,
    ColleagueTasksComponent,
    ReviewsComponent,
    ChatComponent,
    //Pipe
    FilterPipe,
    IsEmptyPipe,
    TotalPipe,
    NumformatPipe,
    TimePipe,
    SearchPipe,
    SafeUrlPipe,
    GroupBy,
    OrderBy,
    OpenDatepickerDirective,
    TableScrollDirective,
  ],
  imports: [
    AngularEditorModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    NgxDocViewerModule,
    NgxIntlTelInputModule,
    SocketIoModule.forRoot(config),
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-top-center',
      preventDuplicates: true,
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient],
      }
    }),
    NgxDaterangepickerMd.forRoot({
      format: 'DD.MM.YYYY',
      customRangeLabel: 'Выбрать дату',
      daysOfWeek: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      firstDay: 1,
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    { provide: LOCALE_ID, useValue: 'ru-RU' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
