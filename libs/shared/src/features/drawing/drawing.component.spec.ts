import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';

import * as imageUtils from '../../services/core/feedback/image.utils';
import { PicsaDrawingComponent } from './drawing.component';

jest.mock('../../services/core/feedback/image.utils', () => ({
  ...jest.requireActual('../../services/core/feedback/image.utils'),
  loadImage: jest.fn(),
}));

describe('PicsaDrawingComponent', () => {
  let component: PicsaDrawingComponent;
  let fixture: ComponentFixture<PicsaDrawingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaDrawingComponent, PicsaTranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaDrawingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectTool', () => {
    it("remembers each tool's own stroke width independently", () => {
      component.strokeWidth.set(10);
      component.selectTool('highlighter');
      expect(component.strokeWidth()).toBe(14); // highlighter is pre-seeded to the thickest preset

      component.selectTool('pen');
      expect(component.strokeWidth()).toBe(10); // pen remembers the width set before switching away
    });

    it('clears the current selection when switching tools', () => {
      component.selectedItemId.set('some-id');
      component.selectTool('eraser');
      expect(component.selectedItemId()).toBeNull();
    });
  });

  describe('text + undo/redo/clear', () => {
    function commitText(value: string) {
      component.textDraft = { x: 10, y: 10, value: '', editingId: null, color: '#1a1a1a', fontSize: 24 };
      component.commitTextEdit(value);
      return component.selectedItemId() as string;
    }

    it('undoSvgStroke/redoSvgStroke round-trip through items', () => {
      commitText('hello world');
      expect(component.items.length).toBe(1);

      component.undoSvgStroke();
      expect(component.items.length).toBe(0);

      component.redoSvgStroke();
      expect(component.items.length).toBe(1);
    });

    it('undo is a no-op on an empty history', () => {
      expect(() => component.undoSvgStroke()).not.toThrow();
      expect(component.items.length).toBe(0);
    });

    it('clearDraw resets items, redo history, and the current selection', () => {
      commitText('hello world');
      component.undoSvgStroke();
      component.selectedItemId.set('some-id');

      component.clearDraw();

      expect(component.items.length).toBe(0);
      component.redoSvgStroke();
      expect(component.items.length).toBe(0); // redo stack was cleared too
      expect(component.selectedItemId()).toBeNull();
    });

    it('highlightRects computes a bar per line spanning the highlighted word range', () => {
      const textId = commitText('hello world');
      const rects = component.highlightRects({ id: 'h1', textId, from: 0, to: 1, color: 'yellow' });
      expect(rects.length).toBe(1);
      expect(rects[0].width).toBeGreaterThan(0);
    });

    it('highlightRects returns nothing for a text id that no longer exists', () => {
      const rects = component.highlightRects({ id: 'h1', textId: 'missing', from: 0, to: 0, color: 'yellow' });
      expect(rects).toEqual([]);
    });
  });

  describe('exportImage', () => {
    it('defaults to svg and strips Angular-internal markup from the output', async () => {
      const result = await component.exportImage();
      expect(result.type).toBe('image/svg+xml');
      const decoded = atob(result.base64);
      expect(decoded).toContain('<svg');
      expect(decoded).not.toContain('_ngcontent');
      expect(decoded).not.toMatch(/class="/);
    });

    it('rasterizes to the requested format via canvas when outputFormat is png/jpeg', async () => {
      (imageUtils.loadImage as jest.Mock).mockResolvedValue({} as HTMLImageElement);
      const fakeCtx = {
        fillRect: jest.fn(),
        drawImage: jest.fn(),
        fillStyle: '',
        font: '',
        measureText: jest.fn(() => ({ width: 10 })),
      } as unknown as CanvasRenderingContext2D;
      jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
      jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,abc123');

      fixture.componentRef.setInput('outputFormat', 'png');
      const result = await component.exportImage();

      expect(result.type).toBe('image/png');
      expect(result.base64).toBe('abc123');
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('backgroundImage', () => {
    it('keeps a square canvas when no background image is set', () => {
      expect(component.canvasWidth()).toBe(384);
      expect(component.canvasHeight()).toBe(384);
    });

    it('scales the canvas to the image aspect ratio once it resolves', async () => {
      (imageUtils.loadImage as jest.Mock).mockResolvedValue({ naturalWidth: 200, naturalHeight: 100 });

      fixture.componentRef.setInput('backgroundImage', 'data:image/png;base64,abc');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.canvasWidth()).toBe(384);
      expect(component.canvasHeight()).toBe(192);
    });
  });
});
