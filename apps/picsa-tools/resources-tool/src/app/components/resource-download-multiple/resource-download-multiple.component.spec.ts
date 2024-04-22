import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceDownloadMultipleComponent } from './resource-download-multiple.component';

describe('ResourceDownloadMultipleComponent', () => {
  let component: ResourceDownloadMultipleComponent;
  let fixture: ComponentFixture<ResourceDownloadMultipleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDownloadMultipleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceDownloadMultipleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
