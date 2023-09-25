import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DownloadsComponent } from './downloads.component';

const routes: Routes = [{ path: '', component: DownloadsComponent }];

@NgModule({
  declarations: [DownloadsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class DownloadsModule {}
