import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { DashboardStorageService } from '../storage';
import { ResourcesDashboardService } from './resources.service';
import { IResourceCollectionRow, IResourceFileRow } from './types';

describe('ResourcesDashboardService', () => {
  let service: ResourcesDashboardService;
  let activeCountry: ReturnType<typeof signal<string | undefined>>;
  let tableMocks: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    activeCountry = signal<string | undefined>('mw');

    const createSelectEqOrder = (data: unknown[] = []) => ({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data, error: null }),
      }),
    });

    tableMocks = {
      resource_collections: {
        select: jest.fn(() => createSelectEqOrder([])),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      resource_files: {
        select: jest.fn(() => createSelectEqOrder([])),
        delete: jest.fn(),
      },
      resource_files_child: {
        select: jest.fn(() => createSelectEqOrder([])),
      },
      resource_links: {
        select: jest.fn(() => createSelectEqOrder([])),
        delete: jest.fn(),
      },
    };

    const mockSupabaseService = {
      ready: jest.fn().mockResolvedValue(true),
      db: {
        table: jest.fn((name: string) => tableMocks[name]),
      },
      storage: {
        deleteFile: jest.fn().mockResolvedValue(undefined),
      },
    };

    const mockStorageService = {
      ready: jest.fn().mockResolvedValue(true),
    };

    const mockDeploymentService = {
      activeDeploymentCountry: activeCountry,
    };

    await TestBed.configureTestingModule({
      providers: [
        ResourcesDashboardService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: DashboardStorageService, useValue: mockStorageService },
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
      ],
    }).compileComponents();

    service = TestBed.inject(ResourcesDashboardService);
  });

  it('saveCollection uses insert for new collections and update for existing collections', async () => {
    const savedRow = { id: 'col-1', title: 'Weather' } as IResourceCollectionRow;
    const singleMock = jest.fn().mockResolvedValue({ data: savedRow, error: null });
    const selectMock = jest.fn().mockReturnValue({ single: singleMock });
    const eqMock = jest.fn().mockReturnValue({ select: selectMock });

    tableMocks.resource_collections.insert.mockReturnValue({ select: selectMock });
    tableMocks.resource_collections.update.mockReturnValue({ eq: eqMock });

    const refreshSpy = jest.spyOn(service, 'refresh').mockResolvedValue(undefined);

    await service.saveCollection({ title: 'Weather' });
    expect(tableMocks.resource_collections.insert).toHaveBeenCalledTimes(1);
    expect(tableMocks.resource_collections.upsert).not.toHaveBeenCalled();

    await service.saveCollection({ id: 'col-1', title: 'Updated Weather' });
    expect(tableMocks.resource_collections.update).toHaveBeenCalledTimes(1);
    expect(eqMock).toHaveBeenCalledWith('id', 'col-1');
    expect(tableMocks.resource_collections.upsert).not.toHaveBeenCalled();
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });

  it('syncResourceCollections updates affected collections and throws if any update fails', async () => {
    service.collections.set([
      { id: 'col-1', resource_files: ['file-1'], resource_links: [] } as unknown as IResourceCollectionRow,
      { id: 'col-2', resource_files: [], resource_links: [] } as unknown as IResourceCollectionRow,
    ]);

    const eqMock = jest
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'RLS denied' } });
    tableMocks.resource_collections.update.mockReturnValue({ eq: eqMock });
    const refreshSpy = jest.spyOn(service, 'refresh').mockResolvedValue(undefined);

    await expect(service.syncResourceCollections('files', 'file-1', ['col-2'])).rejects.toThrow('RLS denied');

    expect(tableMocks.resource_collections.update).toHaveBeenCalledWith({ resource_files: [] });
    expect(tableMocks.resource_collections.update).toHaveBeenCalledWith({ resource_files: ['file-1'] });
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('deleteResourceFile deletes row without batch-updating resource_collections', async () => {
    service.collections.set([
      { id: 'col-1', resource_files: ['file-1'], resource_links: [] } as unknown as IResourceCollectionRow,
    ]);

    const deleteEqMock = jest.fn().mockResolvedValue({ error: null });
    tableMocks.resource_files.delete.mockReturnValue({ eq: deleteEqMock });
    const refreshSpy = jest.spyOn(service, 'refresh').mockResolvedValue(undefined);

    await service.deleteResourceFile({ id: 'file-1', storage_file: null, cover_image: null } as IResourceFileRow);

    expect(deleteEqMock).toHaveBeenCalledWith('id', 'file-1');
    expect(tableMocks.resource_collections.update).not.toHaveBeenCalled();
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
