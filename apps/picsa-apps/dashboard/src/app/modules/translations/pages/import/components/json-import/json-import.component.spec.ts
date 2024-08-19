import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonImportComponent } from './json-import.component';

describe('JsonImportComponent', () => {
  let component: JsonImportComponent;
  let fixture: ComponentFixture<JsonImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonImportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
