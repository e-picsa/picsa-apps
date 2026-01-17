import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceSearchComponent } from './search.component';

describe('ResourceSearchComponent', () => {
  let component: ResourceSearchComponent;
  let fixture: ComponentFixture<ResourceSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
