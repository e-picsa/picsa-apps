import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardStorageService } from '../../services/storage.service';
import { DashboardStorageLinkComponent } from './storage-link.component';

describe('StorageLinkComponent', () => {
  let component: DashboardStorageLinkComponent;
  let fixture: ComponentFixture<DashboardStorageLinkComponent>;
  let mockStorageService: { getStorageFileByPath: jest.Mock };

  beforeEach(async () => {
    mockStorageService = {
      getStorageFileByPath: jest.fn().mockResolvedValue({
        id: '1',
        bucket_id: 'mw',
        name: 'mw/resources/test.pdf',
        publicUrl: 'http://localhost/mw/resources/test.pdf',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardStorageLinkComponent],
      providers: [{ provide: DashboardStorageService, useValue: mockStorageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStorageLinkComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'mw/resources/test.pdf');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reload storage entry when id input changes', async () => {
    await fixture.whenStable();
    expect(mockStorageService.getStorageFileByPath).toHaveBeenCalledWith('mw/resources/test.pdf');
    expect(component.entryName()).toBe('test.pdf');

    mockStorageService.getStorageFileByPath.mockResolvedValueOnce({
      id: '2',
      bucket_id: 'mw',
      name: 'mw/resources/cover.png',
      publicUrl: 'http://localhost/mw/resources/cover.png',
    });

    fixture.componentRef.setInput('id', 'mw/resources/cover.png');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockStorageService.getStorageFileByPath).toHaveBeenCalledWith('mw/resources/cover.png');
    expect(component.entryName()).toBe('cover.png');
    expect(component.fileTypeIcon()).toBe('image');
  });
});
