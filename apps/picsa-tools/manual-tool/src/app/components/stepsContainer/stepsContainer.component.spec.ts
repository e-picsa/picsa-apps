import { ComponentFixture, TestBed } from '@angular/core/testing';

import { stepsContainerComponent } from './stepsContainer.component';

describe('stepsContainer', () => {
  let component: stepsContainerComponent;
  let fixture: ComponentFixture<stepsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [stepsContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(stepsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
