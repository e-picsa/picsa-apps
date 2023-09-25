import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDownloadComponent } from './resource-download.component';

describe('ResourceDownloadComponent', () => {
  let component: ResourceDownloadComponent;
  let fixture: ComponentFixture<ResourceDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourceDownloadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
