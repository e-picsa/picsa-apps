import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { CropInformationService } from '../../../../../services';
import { CropProbabilityDocxService } from '../../../../../services/crop-probability-docx.service';
import { CropProbabilityTableComponent } from './probability-table.component';

describe('CropProbabilityTableComponent', () => {
  let component: CropProbabilityTableComponent;
  let fixture: ComponentFixture<CropProbabilityTableComponent>;
  let mockDocxService: jest.Mocked<CropProbabilityDocxService>;

  beforeEach(async () => {
    mockDocxService = {
      exportDocx: jest.fn().mockResolvedValue(undefined),
      buildDocxDocument: jest.fn(),
      formatProbability: jest.fn(),
    } as any;

    const mockCropInfoService = {
      cropData: jest.fn().mockReturnValue([]),
    };

    const mockDeploymentService = {
      activeDeploymentCountry: signal('global_en'),
      activeDeployment: signal({ country_code: 'global_en' }),
    };

    await TestBed.configureTestingModule({
      imports: [CropProbabilityTableComponent, PicsaTranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: CropProbabilityDocxService, useValue: mockDocxService },
        { provide: CropInformationService, useValue: mockCropInfoService },
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilityTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('waterRequirements', {});
    fixture.componentRef.setInput('stationProbabilities', []);
    fixture.componentRef.setInput('station', { station_name: 'DEDZA MET' });
    fixture.componentRef.setInput('startProbabilities', []);
    fixture.componentRef.setInput('locationName', 'Dedza North');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call docx export service when exportDocx is called', async () => {
    await component.exportDocx();
    expect(mockDocxService.exportDocx).toHaveBeenCalledWith({
      stationData: expect.any(Array),
      tableMeta: expect.objectContaining({
        label: 'Dedza North',
        station_label: 'DEDZA MET',
      }),
      locationName: 'Dedza North',
    });
  });
});
