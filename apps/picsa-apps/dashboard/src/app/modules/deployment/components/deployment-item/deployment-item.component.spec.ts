import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentItemComponent } from './deployment-item.component';

describe('DeploymentItemComponent', () => {
  let component: DeploymentItemComponent;
  let fixture: ComponentFixture<DeploymentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeploymentItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('deployment', { id: 'mw', label: 'Malawi' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render deployment label and icon', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Malawi');
    expect(el.querySelector('img')).toBeNull();
    fixture.componentRef.setInput('deployment', {
      id: 'mw',
      label: 'Malawi',
      icon_path: 'mw/icon.png',
    });
    fixture.detectChanges();
    expect(el.querySelector('img')).toBeTruthy();
  });
});
