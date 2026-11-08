import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ResourceShareComponent } from './resource-share.component';
import { ResourcesToolService } from '../../services/resources-tool.service';

describe('ResourceShareComponent', () => {
  let component: ResourceShareComponent;
  let fixture: ComponentFixture<ResourceShareComponent>;

  const mockDoc = {
    id: 'test-file',
    filename: 'test.pdf',
  } as any;

  let mockResourcesToolService: { shareFile: jest.Mock };

  beforeEach(async () => {
    mockResourcesToolService = {
      shareFile: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceShareComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: ResourcesToolService, useValue: mockResourcesToolService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceShareComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('doc', mockDoc);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stops event propagation and delegates to shareFile', () => {
    const shareSpy = jest.spyOn(component.service, 'shareFile').mockResolvedValue(undefined as any);
    const mockEvent = {
      stopImmediatePropagation: jest.fn(),
    } as unknown as Event;

    component.handleShare(mockEvent);
    expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
    expect(shareSpy).toHaveBeenCalledWith(mockDoc);
  });
});
