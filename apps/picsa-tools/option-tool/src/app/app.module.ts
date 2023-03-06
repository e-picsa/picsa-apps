import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { EditorComponent } from './components/editor/editor.component';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './pages/home/home.component';
import { OptionMaterialModule } from './material.module';
import { ReactiveFormsModule} from '@angular/forms';
@NgModule({
  declarations: [AppComponent, HomeComponent, EditorComponent],
  imports: [BrowserModule, OptionMaterialModule, FormsModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
