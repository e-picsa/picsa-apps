import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetEditorSidebarComponent } from './editor-sidebar.component';

describe('EditorSidebarComponent', () => {
  let component: BudgetEditorSidebarComponent;
  let fixture: ComponentFixture<BudgetEditorSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BudgetEditorSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetEditorSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
