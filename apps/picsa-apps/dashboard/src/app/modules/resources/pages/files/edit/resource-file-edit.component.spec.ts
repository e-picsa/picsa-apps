import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceFileEditComponent } from './resource-file-edit.component';

describe('ResourceFileEditComponent', () => {
  let component: ResourceFileEditComponent;
  let fixture: ComponentFixture<ResourceFileEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFileEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
