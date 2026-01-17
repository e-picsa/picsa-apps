import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsEditComponent } from './translations-edit.component';

describe('TranslationsEditComponent', () => {
  let component: TranslationsEditComponent;
  let fixture: ComponentFixture<TranslationsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
