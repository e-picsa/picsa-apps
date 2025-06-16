import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceCollectionEditComponent } from './resource-collection-edit.component';

describe('ResourceCollectionEditComponent', () => {
  let component: ResourceCollectionEditComponent;
  let fixture: ComponentFixture<ResourceCollectionEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCollectionEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCollectionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
