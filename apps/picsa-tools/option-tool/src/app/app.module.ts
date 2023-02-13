import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';
import { OptionMaterialModule } from './material.module';
import { HomeComponent } from './pages/home/home.component';
import { EditorComponent } from './components/editor/editor.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, EditorComponent],
  imports: [BrowserModule, OptionMaterialModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
