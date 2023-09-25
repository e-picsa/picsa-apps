import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ResourcesComponentsModule } from '../../components/components.module';
import { DownloadsComponent } from './downloads.component';

const routes: Routes = [{ path: '', component: DownloadsComponent, title: 'Downloads' }];

@NgModule({
  declarations: [DownloadsComponent],
  imports: [CommonModule, RouterModule.forChild(routes), ResourcesComponentsModule],
})
export class DownloadsModule {}
