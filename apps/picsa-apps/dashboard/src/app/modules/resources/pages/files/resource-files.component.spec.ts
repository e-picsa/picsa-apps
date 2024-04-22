import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceFilesComponent } from './resource-files.component';

describe('ResourceFilesComponent', () => {
  let component: ResourceFilesComponent;
  let fixture: ComponentFixture<ResourceFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFilesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
