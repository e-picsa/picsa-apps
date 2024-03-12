import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEntryPageComponent } from './new_entry.page';

describe('NewEntryComponent', () => {
  let component: NewEntryPageComponent;
  let fixture: ComponentFixture<NewEntryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEntryPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewEntryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
