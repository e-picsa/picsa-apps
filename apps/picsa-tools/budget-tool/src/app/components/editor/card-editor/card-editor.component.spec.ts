import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEditorComponent } from './card-editor.component';

describe('CardEditorComponent', () => {
  let component: CardEditorComponent;
  let fixture: ComponentFixture<CardEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
