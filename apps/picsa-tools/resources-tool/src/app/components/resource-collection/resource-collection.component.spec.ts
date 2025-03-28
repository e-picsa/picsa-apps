import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceCollectionComponent } from './resource-collection.component';

describe('ResourceCollectionComponent', () => {
  let component: ResourceCollectionComponent;
  let fixture: ComponentFixture<ResourceCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCollectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
