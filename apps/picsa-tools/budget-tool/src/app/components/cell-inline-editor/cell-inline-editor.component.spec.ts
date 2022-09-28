import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CellInlineEditorComponent } from './cell-inline-editor.component';

describe('CellInlineEditorComponent', () => {
  let component: CellInlineEditorComponent;
  let fixture: ComponentFixture<CellInlineEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CellInlineEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CellInlineEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
