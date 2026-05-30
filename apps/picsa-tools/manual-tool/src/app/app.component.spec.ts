import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PicsaManualTool } from './app.component';

describe('PicsaManualTool', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, PicsaManualTool],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(PicsaManualTool);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'picsa-tools-manual-tool'`, () => {
    const fixture = TestBed.createComponent(PicsaManualTool);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('picsa-tools-manual-tool');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(PicsaManualTool);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome picsa-tools-manual-tool');
  });
});
