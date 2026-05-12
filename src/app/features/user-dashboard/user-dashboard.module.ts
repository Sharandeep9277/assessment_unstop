import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { UserChartComponent } from './components/user-chart/user-chart.component';
import { UserTableComponent } from './components/user-table/user-table.component';
import { UserDashboardComponent } from './user-dashboard.component';

@NgModule({
  declarations: [UserDashboardComponent, UserChartComponent, UserTableComponent],
  imports: [CommonModule, FormsModule, SharedModule],
  exports: [UserDashboardComponent],
})
export class UserDashboardModule {}
