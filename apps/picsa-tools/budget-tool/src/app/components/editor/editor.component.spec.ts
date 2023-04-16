import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetEditorComponent } from './editor.component';

describe('BudgetEditorComponent', () => {
  let component: BudgetEditorComponent;
  let fixture: ComponentFixture<BudgetEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BudgetEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
