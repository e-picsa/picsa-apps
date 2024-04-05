import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceLinksComponent } from './resource-links.component';

describe('ResourceLinksComponent', () => {
  let component: ResourceLinksComponent;
  let fixture: ComponentFixture<ResourceLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLinksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
