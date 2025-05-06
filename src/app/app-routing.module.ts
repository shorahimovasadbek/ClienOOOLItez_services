import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { NoAuthGuard } from './services/noauth.guard';
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

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    pathMatch: 'full',
    canActivate: [NoAuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'tickets',
    component: TicketComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'tickets/:id',
    component: TicketDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'tasks/:id/edit',
    component: TasksEditComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'tasks/:id/view',
    component: TasksDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'finance',
    component: FinanceComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'documents',
    component: DocumentsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'documents/:id/:type/:file-type?',
    component: DocumentsOrderDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'statistics',
    component: StatisticsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'statistics/:type',
    component: StatisticsDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'requests',
    component: RequestsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'requests/:id',
    component: RequestsEditComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'companies',
    component: CompaniesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'colleagues',
    component: ColleaguesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'colleagues/add',
    component: ColleagueAddComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'colleagues/:id',
    component: ColleagueDetailComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'profile',
        component: ColleagueProfileComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'tasks',
        component: ColleagueTasksComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'colleagues',
        component: ColleaguesComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'reviews',
        component: ReviewsComponent,
        canActivate: [AuthGuard],
      },
    ]
  },
  {
    path: 'reviews',
    component: ReviewsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    canActivate: [AuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
