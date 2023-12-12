import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageLinkComponent } from './storage-link.component';

describe('StorageLinkComponent', () => {
  let component: StorageLinkComponent;
  let fixture: ComponentFixture<StorageLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StorageLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
