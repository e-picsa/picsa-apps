import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleLandingComponent } from './module-landing.component';

describe('ModuleLandingComponent', () => {
  let component: ModuleLandingComponent;
  let fixture: ComponentFixture<ModuleLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleLandingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
