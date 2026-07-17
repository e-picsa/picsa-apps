import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ITranslationRow, TranslationDashboardService } from './translations.service';

describe('TranslationDashboardService', () => {
  let service: TranslationDashboardService;
  let mockSupabaseService: any;

  beforeEach(() => {
    mockSupabaseService = {
      ready: jasmine.createSpy('ready').and.returnValue(Promise.resolve()),
      db: {
        table: jasmine.createSpy('table').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null })),
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [TranslationDashboardService, { provide: SupabaseService, useValue: mockSupabaseService }],
    });

    service = TestBed.inject(TranslationDashboardService);
  });

  describe('generateTranslationID', () => {
    it('should generate programmatic ID for standard entries', () => {
      const entry = { tool: 'common', context: 'button', text: 'Cancel' };
      const id = service.generateTranslationID(entry);
      expect(id).toBe('common-button-cancel');
    });

    it('should ignore non-alphanumeric characters and lowercase the ID', () => {
      const entry = { tool: 'climate', context: 'forecasts', text: 'Seasonal Rainfall!' };
      const id = service.generateTranslationID(entry);
      expect(id).toBe('climate-forecasts-seasonalrainfall');
    });

    it('should preserve predefined ID if already present', () => {
      const entry = { id: 'climate:chart:temp_max:definition', tool: 'climate', text: '' };
      const id = service.generateTranslationID(entry);
      expect(id).toBe('climate:chart:temp_max:definition');
    });
  });

  describe('exportJson', () => {
    it('should use text as key for standard translations', () => {
      const mockRow: ITranslationRow = {
        id: 'common--cancel',
        created_at: '',
        updated_at: null,
        tool: 'common',
        context: null,
        text: 'Cancel',
        archived: false,
        mw_en: 'Cancel MW',
        mw_ny: 'Tseka',
        mw_tum: null,
        zm_en: null,
        zm_ny: null,
        zm_bem: null,
        zm_toi: null,
        zm_loz: null,
        zm_lun: null,
        zm_kqn: null,
        zm_lue: null,
        ke_sw: null,
        tj_tg: null,
        zw_en: null,
      };

      service.translations.set([mockRow]);

      const mwJson = service.exportJson('mw_en');
      expect(mwJson['Cancel']).toBe('Cancel MW');
    });

    it('should use id as key for override translation entries', () => {
      const mockRow: ITranslationRow = {
        id: 'climate:chart:temp_max:definition',
        created_at: '',
        updated_at: null,
        tool: 'climate',
        context: null,
        text: '',
        archived: false,
        mw_en: 'The maximum temperature',
        mw_ny: null,
        mw_tum: null,
        zm_en: null,
        zm_ny: null,
        zm_bem: null,
        zm_toi: null,
        zm_loz: null,
        zm_lun: null,
        zm_kqn: null,
        zm_lue: null,
        ke_sw: null,
        tj_tg: null,
        zw_en: null,
      };

      service.translations.set([mockRow]);

      const mwJson = service.exportJson('mw_en');
      expect(mwJson['climate:chart:temp_max:definition']).toBe('The maximum temperature');
    });

    it('should fall back to placeholder with key for missing translations', () => {
      const mockRow: ITranslationRow = {
        id: 'common--save',
        created_at: '',
        updated_at: null,
        tool: 'common',
        context: null,
        text: 'Save',
        archived: false,
        mw_en: null, // missing translation
        mw_ny: null,
        mw_tum: null,
        zm_en: null,
        zm_ny: null,
        zm_bem: null,
        zm_toi: null,
        zm_loz: null,
        zm_lun: null,
        zm_kqn: null,
        zm_lue: null,
        ke_sw: null,
        tj_tg: null,
        zw_en: null,
      };

      service.translations.set([mockRow]);

      const mwJson = service.exportJson('mw_en');
      expect(mwJson['Save']).toBe('•Save•');
    });

    it('should sort keys alphabetically in the exported JSON', () => {
      const rowA: ITranslationRow = {
        id: 'common--save',
        created_at: '',
        updated_at: null,
        tool: 'common',
        context: null,
        text: 'Save',
        archived: false,
        mw_en: 'Save MW',
        mw_ny: null,
        mw_tum: null,
        zm_en: null,
        zm_ny: null,
        zm_bem: null,
        zm_toi: null,
        zm_loz: null,
        zm_lun: null,
        zm_kqn: null,
        zm_lue: null,
        ke_sw: null,
        tj_tg: null,
        zw_en: null,
      };

      const rowB: ITranslationRow = {
        id: 'common--cancel',
        created_at: '',
        updated_at: null,
        tool: 'common',
        context: null,
        text: 'Cancel',
        archived: false,
        mw_en: 'Cancel MW',
        mw_ny: null,
        mw_tum: null,
        zm_en: null,
        zm_ny: null,
        zm_bem: null,
        zm_toi: null,
        zm_loz: null,
        zm_lun: null,
        zm_kqn: null,
        zm_lue: null,
        ke_sw: null,
        tj_tg: null,
        zw_en: null,
      };

      service.translations.set([rowA, rowB]);

      const mwJson = service.exportJson('mw_en');
      const keys = Object.keys(mwJson);
      expect(keys[0]).toBe('Cancel');
      expect(keys[1]).toBe('Save');
    });
  });
});
