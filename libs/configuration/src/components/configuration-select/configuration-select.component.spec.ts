import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaConfigurationSelectComponent } from './configuration-select.component';

describe('PicsaConfigurationSelectComponent', () => {
  let component: PicsaConfigurationSelectComponent;
  let fixture: ComponentFixture<PicsaConfigurationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaConfigurationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaConfigurationSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
