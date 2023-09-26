import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DownloadsPageComponent } from './downloads.page';

describe('DownloadsComponent', () => {
  let component: DownloadsPageComponent;
  let fixture: ComponentFixture<DownloadsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DownloadsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
