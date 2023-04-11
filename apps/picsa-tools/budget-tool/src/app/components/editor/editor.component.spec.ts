import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgeEditorComponent } from './editor.component';

describe('BudgeEditorComponent', () => {
  let component: BudgeEditorComponent;
  let fixture: ComponentFixture<BudgeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BudgeEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
