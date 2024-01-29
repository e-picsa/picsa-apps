import { SearchComponent } from "./search.component";
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { ResourcesMaterialModule } from "../../material.module";
import { ResourcesComponentsModule } from "../../components/components.module";
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

const routes: Routes = [{ path: '', component: SearchComponent, title: 'Search' }];

@NgModule({
    imports: [RouterModule.forChild(routes),
              FormsModule,
              ResourcesMaterialModule,
              ResourcesComponentsModule,
              PicsaCommonComponentsModule,
              PicsaTranslateModule],
    exports: [RouterModule],
  })
  export class SearchModule {}