import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getFallbackTypeForFilename } from '@picsa/components/fallback-image/fallback-image.types';

import { IStorageEntry } from '../../services/supabase-storage.service';
import { SupabaseService } from '../../supabase.service';
import { SupabaseStorageFilePickerComponent, SupabaseStoragePickerDirective } from './storage-file-picker.component';

@Component({
  imports: [SupabaseStoragePickerDirective],
  template: `<button supabaseStoragePicker storageBucketName="mw">Pick File</button>`,
})
class TestHostComponent {}

describe('SupabaseStoragePickerDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe('SupabaseStorageFilePickerComponent', () => {
  const mockEntries = [
    { id: '2', name: 'b.pdf', bucket_id: 'mw' },
    { id: '1', name: 'a.pdf', bucket_id: 'mw' },
    { id: '3', name: '.hidden', bucket_id: 'mw' },
  ] as IStorageEntry[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupabaseStorageFilePickerComponent],
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            ready: async () => undefined,
            storage: {
              list: async () => mockEntries,
              getPublicLink: (bucket: string, path: string) => `https://${bucket}/${path}`,
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create with empty signal defaults', () => {
    const fixture = TestBed.createComponent(SupabaseStorageFilePickerComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.globalEntries()).toEqual([]);
    expect(component.bucketEntries()).toEqual([]);
    expect(component.storageBucketName()).toBeUndefined();
  });

  it('should load, filter and sort entries into signals', async () => {
    const fixture = TestBed.createComponent(SupabaseStorageFilePickerComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const names = fixture.componentInstance.globalEntries().map((e) => e.name);
    expect(names).toEqual(['a.pdf', 'b.pdf']);
  });

  it('should map filenames to fallback presets', () => {
    expect(getFallbackTypeForFilename('doc.pdf')).toBe('pdf');
    expect(getFallbackTypeForFilename('clip.mp4')).toBe('video');
    expect(getFallbackTypeForFilename('sound.mp3')).toBe('audio');
    expect(getFallbackTypeForFilename('photo.jpg')).toBe('image');
    expect(getFallbackTypeForFilename('notes.txt')).toBe('document');
    expect(getFallbackTypeForFilename(undefined)).toBe('document');
  });

  it('should preview direct image only for image files', () => {
    const fixture = TestBed.createComponent(SupabaseStorageFilePickerComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.previewSrc()).toBeUndefined();

    component.selected.set([{ id: '1', name: 'a.pdf', bucket_id: 'mw' } as IStorageEntry]);
    expect(component.previewSrc()).toBeUndefined();
    expect(component.previewFallbackType()).toBe('pdf');

    component.selected.set([{ id: '4', name: 'photo.png', bucket_id: 'mw' } as IStorageEntry]);
    expect(component.previewSrc()).toBe('https://mw/photo.png');
    expect(component.previewFallbackType()).toBe('image');
  });
});
