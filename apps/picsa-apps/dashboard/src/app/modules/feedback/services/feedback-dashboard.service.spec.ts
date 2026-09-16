import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { FeedbackDashboardService } from './feedback-dashboard.service';

describe('FeedbackDashboardService', () => {
  let service: FeedbackDashboardService;
  let mockSupabase: { invokeFunction: jest.Mock; config: { apiUrl: string } };

  beforeEach(() => {
    mockSupabase = { invokeFunction: jest.fn(), config: { apiUrl: 'http://127.0.0.1:54321' } };
    TestBed.configureTestingModule({
      providers: [FeedbackDashboardService, { provide: SupabaseService, useValue: mockSupabase }],
    });
    service = TestBed.inject(FeedbackDashboardService);
  });

  it('should call list endpoint with provided filters', async () => {
    mockSupabase.invokeFunction.mockResolvedValue([]);
    await service.list({ status: 'open', type: 'bug_report', limit: 25, offset: 0 });
    expect(mockSupabase.invokeFunction).toHaveBeenCalledWith('dashboard/feedback/list', {
      body: { status: 'open', type: 'bug_report', limit: 25, offset: 0 },
    });
  });

  it('should call list endpoint with default limit and offset', async () => {
    mockSupabase.invokeFunction.mockResolvedValue([]);
    await service.list();
    expect(mockSupabase.invokeFunction).toHaveBeenCalledWith('dashboard/feedback/list', {
      body: { limit: 100, offset: 0 },
    });
  });

  it('should pass id filter through to list endpoint', async () => {
    mockSupabase.invokeFunction.mockResolvedValue([]);
    await service.list({ id: 'abc-123', limit: 1, offset: 0 });
    expect(mockSupabase.invokeFunction).toHaveBeenCalledWith('dashboard/feedback/list', {
      body: { id: 'abc-123', limit: 1, offset: 0 },
    });
  });

  it('should return empty array when list returns null', async () => {
    mockSupabase.invokeFunction.mockResolvedValue(null);
    expect(await service.list()).toEqual([]);
  });

  it('should call update endpoint with id and changes', async () => {
    const row = { id: '123', status: 'in_review', admin_notes: 'Investigating' };
    mockSupabase.invokeFunction.mockResolvedValue(row);
    const result = await service.update('123', { status: 'in_review', admin_notes: 'Investigating' });
    expect(mockSupabase.invokeFunction).toHaveBeenCalledWith('dashboard/feedback/update', {
      body: { id: '123', status: 'in_review', admin_notes: 'Investigating' },
    });
    expect(result).toEqual(row);
  });

  it('should call signed-url endpoint with id and rewrite origin', async () => {
    const signedUrl = { signed_url: 'https://example.com/screenshot.png', expires_in: 300 };
    mockSupabase.invokeFunction.mockResolvedValue(signedUrl);
    const result = await service.getSignedUrl('123');
    expect(mockSupabase.invokeFunction).toHaveBeenCalledWith('dashboard/feedback/signed-url', { body: { id: '123' } });
    expect(result.signed_url).toBe('http://127.0.0.1:54321/screenshot.png');
    expect(result.expires_in).toBe(300);
  });

  it('should rewrite internal edge-runtime origin to public Supabase apiUrl', async () => {
    const internalSignedUrl = 'http://kong:8000/storage/v1/object/sign/feedback/reports/x.jpg?token=abc';
    mockSupabase.invokeFunction.mockResolvedValue({ signed_url: internalSignedUrl, expires_in: 300 });
    const result = await service.getSignedUrl('123');
    expect(result.signed_url).toBe('http://127.0.0.1:54321/storage/v1/object/sign/feedback/reports/x.jpg?token=abc');
    expect(result.expires_in).toBe(300);
  });
});
