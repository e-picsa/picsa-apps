import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PicsaCropProbabilityTool } from './app.component';

describe('PicsaCropProbabilityTool', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaCropProbabilityTool],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(PicsaCropProbabilityTool);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'crop-probability-tool'`, () => {
    const fixture = TestBed.createComponent(PicsaCropProbabilityTool);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('crop-probability-tool');
  });
});
