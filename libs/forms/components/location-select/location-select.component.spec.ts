import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { IGeolocationData, ILocationSelection } from '@picsa/data/geoLocation';
import * as geoDataModule from '@picsa/data/geoLocation';

import { FormLocationSelectComponent } from './location-select.component';

describe('FormLocationSelectComponent', () => {
  let component: FormLocationSelectComponent;
  let fixture: ComponentFixture<FormLocationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormLocationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormLocationSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('countryCode', 'zw');
    fixture.detectChanges();
  });

  it('auto-selects single-district province and clears stale district on multi-district province switch', () => {
    const emitted: ILocationSelection[] = [];
    component.valueChanged.subscribe((v) => emitted.push(v));

    component.onLayerSelectionChange(0, 'manicaland');
    fixture.detectChanges();
    component.onLayerSelectionChange(1, 'buhera');
    fixture.detectChanges();
    expect(emitted[emitted.length - 1]).toEqual({ province: 'manicaland', district: 'buhera' });

    // Harare Province has 1 district -> auto-selected
    component.onLayerSelectionChange(0, 'harare_province');
    fixture.detectChanges();
    expect(component.isValid()).toBe(true);
    expect(emitted[emitted.length - 1]).toEqual({ province: 'harare_province', district: 'harare' });

    // Masvingo has multiple districts -> district cleared until picked
    component.onLayerSelectionChange(0, 'masvingo');
    fixture.detectChanges();
    expect(component.isValid()).toBe(false);
    expect(emitted[emitted.length - 1]).toEqual({ province: 'masvingo' });

    component.onLayerSelectionChange(1, 'bikita');
    fixture.detectChanges();
    expect(component.isValid()).toBe(true);
    expect(emitted[emitted.length - 1]).toEqual({ province: 'masvingo', district: 'bikita' });
  });

  it('caps visible layers to the requested tool layer (e.g. MW forecast=district vs cropProbability=epa)', () => {
    const mwData = geoDataModule.getGeoLocationData('mw');
    const mwTwoLayer: IGeolocationData = {
      topoJson: mwData.topoJson,
      layers: [
        mwData.layers[0],
        {
          key: 'epa',
          label: 'EPA',
          parentLayer: 'district',
          locations: [
            { id: 'chitsime_epa', label: 'Chitsime EPA', parentId: 'lilongwe' },
            { id: 'mitundu_epa', label: 'Mitundu EPA', parentId: 'lilongwe' },
          ],
        },
      ],
      toolLayers: { forecast: 'district', cropProbability: 'epa', climate: 'epa' },
    };
    const spy = jest.spyOn(geoDataModule, 'getGeoLocationData').mockReturnValue(mwTwoLayer);
    try {
      fixture.componentRef.setInput('countryCode', 'mw');
      fixture.componentRef.setInput('tool', 'forecast');
      fixture.componentRef.setInput('value', { district: 'lilongwe', epa: 'chitsime_epa' });
      fixture.detectChanges();
      expect(component.visibleLayers().map((l) => l.key)).toEqual(['district']);
      expect(component.selectedByLayer()).toEqual({ district: 'lilongwe' });
      expect(component.isValid()).toBe(true);

      fixture.componentRef.setInput('tool', 'cropProbability');
      fixture.detectChanges();
      expect(component.visibleLayers().map((l) => l.key)).toEqual(['district', 'epa']);
    } finally {
      spy.mockRestore();
    }
  });

  it('renders and cascades 3+ layers dynamically', () => {
    const threeLayerData: IGeolocationData = {
      topoJson: async () => ({}) as never,
      layers: [
        { key: 'region', label: 'Region', locations: [{ id: 'north', label: 'North' }] },
        {
          key: 'province',
          label: 'Province',
          parentLayer: 'region',
          locations: [{ id: 'prov_a', label: 'Province A', parentId: 'north' }],
        },
        {
          key: 'ward',
          label: 'Ward',
          parentLayer: 'province',
          locations: [
            { id: 'ward_1', label: 'Ward 1', parentId: 'prov_a' },
            { id: 'ward_2', label: 'Ward 2', parentId: 'prov_a' },
          ],
        },
      ],
      toolLayers: { cropProbability: 'ward', forecast: 'province', climate: 'ward' },
    };
    const spy = jest.spyOn(geoDataModule, 'getGeoLocationData').mockReturnValue(threeLayerData);
    try {
      fixture.componentRef.setInput('countryCode', 'zm');
      fixture.detectChanges();
      expect(component.layerRows()).toHaveLength(3);

      component.onLayerSelectionChange(0, 'north');
      fixture.detectChanges();
      expect(component.selectedByLayer()).toEqual({ region: 'north', province: 'prov_a' });
      expect(component.isValid()).toBe(false);

      component.onLayerSelectionChange(2, 'ward_2');
      fixture.detectChanges();
      expect(component.selectedByLayer()).toEqual({ region: 'north', province: 'prov_a', ward: 'ward_2' });
      expect(component.isValid()).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
