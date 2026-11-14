import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { IResourcePreviewDialogData, ResourcePreviewDialogComponent } from './index';

async function setup(data: IResourcePreviewDialogData) {
  await TestBed.configureTestingModule({
    imports: [ResourcePreviewDialogComponent],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: jest.fn() } },
    ],
  }).compileComponents();
  const fixture: ComponentFixture<ResourcePreviewDialogComponent> =
    TestBed.createComponent(ResourcePreviewDialogComponent);
  fixture.detectChanges();
  return fixture;
}

describe('ResourcePreviewDialogComponent', () => {
  it('should render pdf file in iframe', async () => {
    const fixture = await setup({
      kind: 'File',
      title: 'GAP manual',
      status: 'In Sync',
      fileUrl: 'https://example.com/gap.pdf',
      fileKind: 'pdf',
    });
    const iframe = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement | null;
    expect(iframe?.src).toBe('https://example.com/gap.pdf');
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
  });

  it('should render video file in video element', async () => {
    const fixture = await setup({
      kind: 'File',
      title: 'Clip',
      status: 'In Sync',
      fileUrl: 'https://example.com/clip.mp4',
      fileKind: 'video',
    });
    expect(fixture.nativeElement.querySelector('video')?.getAttribute('src')).toBe('https://example.com/clip.mp4');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });

  it('should not iframe non-http urls, falling back to external link', async () => {
    const fixture = await setup({
      kind: 'File',
      title: 'Evil',
      status: 'Differs',
      fileUrl: 'javascript:alert(1)',
      fileKind: 'pdf',
    });
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    // no inline preview and no file fallback - only the href-sanitized footer link remains
    expect(fixture.nativeElement.textContent).toContain('No previewable file attached');
    expect(fixture.nativeElement.textContent).toContain('Open Original');
  });

  it('should render link with open button and bundled-only note', async () => {
    const fixture = await setup({
      kind: 'Link',
      title: 'Access Agriculture',
      status: 'Orphaned in App',
      linkUrl: 'https://www.accessagriculture.org',
      bundledOnly: true,
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('https://www.accessagriculture.org');
    expect(text).toContain('Bundled copy only');
    expect(fixture.nativeElement.querySelector('a[href="https://www.accessagriculture.org"]')).toBeTruthy();
  });

  it('should render collection member lists', async () => {
    const fixture = await setup({
      kind: 'Collection',
      title: 'Crops',
      status: 'Missing in App',
      files: [{ id: 'gap', title: 'GAP manual' }],
      links: [{ id: 'accessAg', title: 'Access Agriculture' }],
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Files (1)');
    expect(text).toContain('GAP manual');
    expect(text).toContain('Links (1)');
    expect(text).toContain('Access Agriculture');
  });
});
