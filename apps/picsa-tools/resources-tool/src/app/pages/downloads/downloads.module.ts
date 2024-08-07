import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';

import { ResourcesComponentsModule } from '../../components/components.module';
import { DownloadsPageComponent } from './downloads.page';

const routes: Routes = [{ path: '', component: DownloadsPageComponent, title: 'Downloads' }];

@NgModule({
  declarations: [DownloadsPageComponent],
  imports: [CommonModule, RouterModule.forChild(routes), ResourcesComponentsModule, SizeMBPipe],
})
export class DownloadsModule {}
