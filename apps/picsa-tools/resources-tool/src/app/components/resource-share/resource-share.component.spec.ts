import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceShareComponent } from './resource-share.component';

describe('ResourceShareComponent', () => {
  let component: ResourceShareComponent;
  let fixture: ComponentFixture<ResourceShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourceShareComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
