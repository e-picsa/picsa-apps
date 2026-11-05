import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateForecastPageComponent } from './forecast.component';

describe('ClimateForecastPageComponent', () => {
  let component: ClimateForecastPageComponent;
  let fixture: ComponentFixture<ClimateForecastPageComponent>;

  beforeEach(async () => {
    const mockSupabaseService = {
      ready: () => Promise.resolve(),
      db: {
        table: () => ({
          liveSignal: () => signal([]),
          select: () => ({
            eq: () => ({
              like: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      },
      storage: {
        getPublicLink: () => '',
      },
      functions: {
        setHeaders: () => null,
      },
      invokeFunction: () => Promise.resolve({}),
    };

    await TestBed.configureTestingModule({
      imports: [ClimateForecastPageComponent],
      providers: [provideRouter([]), { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateForecastPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a filter chip for each forecast type', () => {
    const chips = fixture.nativeElement.querySelectorAll('mat-chip-option');
    expect(chips.length).toBe(5);
  });

  it('restricts manual adds to seasonal and downscaled types', () => {
    expect(component.canAddForecast()).toBe(false);
    for (const filter of ['daily', 'weekly', 'all'] as const) {
      component.activeFilter.set(filter);
      expect(component.canAddForecast()).toBe(false);
    }
    for (const filter of ['seasonal', 'downscaled'] as const) {
      component.activeFilter.set(filter);
      expect(component.canAddForecast()).toBe(true);
    }
  });
});
