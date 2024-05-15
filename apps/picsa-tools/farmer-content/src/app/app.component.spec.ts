import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PicsaFarmerContent } from './app.component';

describe('PicsaFarmerContent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaFarmerContent, RouterTestingModule],
    }).compileComponents();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(PicsaFarmerContent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome farmer-content');
  });

  it(`should have as title 'farmer-content'`, () => {
    const fixture = TestBed.createComponent(PicsaFarmerContent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('farmer-content');
  });
});
