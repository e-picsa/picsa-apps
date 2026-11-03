import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { ResourceLinkEditComponent } from './resource-link-edit.component';

describe('ResourceLinkEditComponent', () => {
  let component: ResourceLinkEditComponent;
  let fixture: ComponentFixture<ResourceLinkEditComponent>;
  const activeRoles = signal<string[]>([]);
  const activeUser = signal<string | undefined>('author-id');

  beforeEach(async () => {
    activeRoles.set([]);
    activeUser.set('author-id');

    await TestBed.configureTestingModule({
      imports: [ResourceLinkEditComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardAuthService,
          useValue: {
            authUserId: activeUser,
            hasRole: (r?: string) => (r ? activeRoles().includes(r) : true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLinkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables form for non-owner editors and enables for owners or admins', () => {
    component.isCreate.set(false);
    (component as any).resourceOwner.set('author-id');

    activeRoles.set(['resources.editor']);
    activeUser.set('different-user');
    fixture.detectChanges();
    expect(component.canEdit()).toBe(false);
    expect(component.form.disabled).toBe(true);

    activeUser.set('author-id');
    fixture.detectChanges();
    expect(component.canEdit()).toBe(true);
    expect(component.form.enabled).toBe(true);
  });
});
