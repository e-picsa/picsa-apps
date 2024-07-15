import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceLinkEditComponent } from './resource-link-edit.component';

describe('ResourceLinkEditComponent', () => {
  let component: ResourceLinkEditComponent;
  let fixture: ComponentFixture<ResourceLinkEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLinkEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLinkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
