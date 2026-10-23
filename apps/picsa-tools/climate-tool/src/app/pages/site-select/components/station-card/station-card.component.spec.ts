import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IStationMeta } from '@picsa/models';

import { StationCardComponent } from './station-card.component';

describe('StationCardComponent', () => {
  let component: StationCardComponent;
  let fixture: ComponentFixture<StationCardComponent>;

  const mockStation: IStationMeta = {
    id: 'mt_makulu_agrome',
    name: 'Mt. Makulu Agrome',
    latitude: -15.55,
    longitude: 28.25,
    countryCode: 'zm',
    location: ['CHILANGA'],
  };

  const mockNearby = [
    {
      station: mockStation,
      distanceKm: 3,
      isInsideDistrict: true,
      isRecommended: true,
      score: -47,
      mapNumber: 1,
    },
    {
      station: {
        id: 'lusaka_city_airport',
        name: 'Lusaka City Airport',
        latitude: -15.42,
        longitude: 28.32,
        countryCode: 'zm',
        location: ['LUSAKA'],
      },
      distanceKm: 14,
      isInsideDistrict: false,
      isRecommended: false,
      score: 14,
      mapNumber: 15,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StationCardComponent, PicsaTranslateModule.forRoot()],
    }).compileComponents();

    const matIconRegistry = TestBed.inject(MatIconRegistry);
    const domSanitizer = TestBed.inject(DomSanitizer);
    matIconRegistry.addSvgIconLiteral('climate_station', domSanitizer.bypassSecurityTrustHtml('<svg></svg>'));

    fixture = TestBed.createComponent(StationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display station name and map number without distance', () => {
    fixture.componentRef.setInput('displayedStation', {
      station: mockStation,
      mapNumber: 1,
      isPrimary: true,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mt. Makulu Agrome');
    expect(compiled.textContent).toContain('1.');
    expect(compiled.textContent).not.toContain('km');
  });

  it('should render stations without distance and include All Stations button', () => {
    fixture.componentRef.setInput('displayedStation', {
      station: mockStation,
      mapNumber: 1,
      isPrimary: true,
    });
    fixture.componentRef.setInput('nearbyStations', mockNearby);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Lusaka City Airport');
    expect(compiled.textContent).toContain('15.');
    expect(compiled.textContent).not.toContain('km');
    expect(compiled.textContent).toContain('All Stations');
  });

  it('should emit openAllStations when All Stations button is clicked', () => {
    fixture.componentRef.setInput('displayedStation', {
      station: mockStation,
      mapNumber: 1,
      isPrimary: true,
    });
    fixture.componentRef.setInput('nearbyStations', mockNearby);
    fixture.detectChanges();

    const openAllStationsSpy = jest.fn();
    component.openAllStations.subscribe(openAllStationsSpy);

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button[matbutton="outlined"]');
    // Last outlined button is the All Stations button
    const allStationsBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(allStationsBtn.textContent).toContain('All Stations');
    allStationsBtn.click();

    expect(openAllStationsSpy).toHaveBeenCalled();
  });

  it('should emit confirm when View button is clicked', () => {
    fixture.componentRef.setInput('displayedStation', {
      station: mockStation,
      mapNumber: 1,
      isPrimary: true,
    });
    fixture.detectChanges();

    const confirmSpy = jest.fn();
    component.confirm.subscribe(confirmSpy);

    const viewButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button[matbutton="filled"]',
    ) as HTMLButtonElement;
    expect(viewButton).toBeTruthy();
    expect(viewButton.textContent).toContain('Mt. Makulu Agrome');
    viewButton.click();

    expect(confirmSpy).toHaveBeenCalledWith(mockStation);
  });

  it('should emit selectAlternate when an alternate station button is clicked', () => {
    fixture.componentRef.setInput('displayedStation', {
      station: mockStation,
      mapNumber: 1,
      isPrimary: true,
    });
    fixture.componentRef.setInput('nearbyStations', mockNearby);
    fixture.detectChanges();

    const selectSpy = jest.fn();
    component.selectAlternate.subscribe(selectSpy);

    const altButtons = (fixture.nativeElement as HTMLElement).querySelectorAll('button[matbutton="outlined"]');
    // First two buttons are the alternate station options
    (altButtons[1] as HTMLButtonElement).click();

    expect(selectSpy).toHaveBeenCalledWith(mockNearby[1]);
  });
});
