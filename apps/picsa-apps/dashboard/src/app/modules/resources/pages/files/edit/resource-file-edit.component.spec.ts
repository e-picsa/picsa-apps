import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { ResourceFileEditComponent } from './resource-file-edit.component';

describe('ResourceFileEditComponent', () => {
  let component: ResourceFileEditComponent;
  let fixture: ComponentFixture<ResourceFileEditComponent>;
  let mockRoles: ReturnType<typeof signal<string[]>>;
  let mockUserId: ReturnType<typeof signal<string | undefined>>;

  beforeEach(async () => {
    mockRoles = signal<string[]>([]);
    mockUserId = signal<string | undefined>('user-1');

    const mockAuthService = {
      authUserId: mockUserId,
      hasRole: (role?: string) => (role ? mockRoles().includes(role) : true),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceFileEditComponent],
      providers: [provideRouter([]), { provide: DashboardAuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enforce owner-based edit permissions for resources.editor and full access for resources.admin', () => {
    component.isCreate.set(false);
    (component as any).resourceOwner.set('owner-123');

    // Read-only user cannot edit
    mockRoles.set([]);
    mockUserId.set('owner-123');
    expect(component.canEdit()).toBe(false);

    // Editor who does not own the resource cannot edit
    mockRoles.set(['resources.editor']);
    mockUserId.set('other-user');
    expect(component.canEdit()).toBe(false);

    // Editor who owns the resource can edit
    mockUserId.set('owner-123');
    expect(component.canEdit()).toBe(true);

    // Admin can edit any resource regardless of owner
    mockRoles.set(['resources.admin', 'resources.editor']);
    mockUserId.set('other-user');
    expect(component.canEdit()).toBe(true);
  });
});
