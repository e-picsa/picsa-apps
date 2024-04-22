import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceCollectionsComponent } from './resource-collections.component';

describe('ResourceCollectionsComponent', () => {
  let component: ResourceCollectionsComponent;
  let fixture: ComponentFixture<ResourceCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCollectionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
