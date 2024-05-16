import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionHomeComponent } from './extension-home.component';

describe('ExtensionHomeComponent', () => {
  let component: ExtensionHomeComponent;
  let fixture: ComponentFixture<ExtensionHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtensionHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtensionHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
