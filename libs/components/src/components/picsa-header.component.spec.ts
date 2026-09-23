import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaNotificationFeedService } from '@picsa/shared/services/core/notifications';

import { PicsaCommonComponentsService } from '../services/components.service';
import { PicsaHeaderComponent } from './picsa-header.component';

describe('PicsaHeaderComponent', () => {
  let component: PicsaHeaderComponent;
  let fixture: ComponentFixture<PicsaHeaderComponent>;
  const mockUnreadCount = signal(0);

  beforeEach(async () => {
    mockUnreadCount.set(0);
    const mockFeedService = {
      unreadCount: mockUnreadCount,
    };

    await TestBed.configureTestingModule({
      imports: [PicsaHeaderComponent, PicsaTranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        PicsaCommonComponentsService,
        { provide: PicsaNotificationFeedService, useValue: mockFeedService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders header with notification bell link', () => {
    expect(component).toBeTruthy();
    const bellLink = fixture.nativeElement.querySelector('a.notification-bell-btn');
    expect(bellLink).toBeTruthy();
    expect(bellLink.getAttribute('href')).toBe('/notifications');
  });

  it('updates unread count badge reactively', () => {
    expect(component.unreadCount()).toBe(0);
    mockUnreadCount.set(3);
    fixture.detectChanges();
    expect(component.unreadCount()).toBe(3);
  });
});
