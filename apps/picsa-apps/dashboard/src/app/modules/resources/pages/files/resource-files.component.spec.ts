import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ResourceFilesComponent } from './resource-files.component';

describe('ResourceFilesComponent', () => {
  let component: ResourceFilesComponent;
  let fixture: ComponentFixture<ResourceFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFilesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
