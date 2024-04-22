import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaDataTableComponent } from './data-table.component';

describe('PicsaDataTableComponent', () => {
  let component: PicsaDataTableComponent;
  let fixture: ComponentFixture<PicsaDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaDataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
