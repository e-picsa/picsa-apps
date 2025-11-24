import { Injectable } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateComment } from '../components/comment-dialog/comment-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ClimateCommentService {
  constructor(private supabaseService: SupabaseService) {}

  private get discussionsDB() {
    return this.supabaseService.db.table('discussions');
  }

  // Create new discussion record
  async submitComment(stationId: string, comment: ClimateComment): Promise<void> {
    const { error } = await this.discussionsDB.insert({
      tool: 'climate',
      context: {
        station_id: stationId,
        chart_name: comment.chart_name,
      },
      comment: comment.comment,
      created_by: comment.created_by,
      created_by_name: comment.created_by_name,
      resolved: comment.resolved || false,
    });

    if (error) {
      throw error;
    }
  }

  // Fetch discussions for specific station
  async getComments(stationId: string): Promise<ClimateComment[]> {
    const { data, error } = await this.discussionsDB
      .select('*')
      .eq('tool', 'climate')
      .eq('context->>station_id', stationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      station_id: stationId,
      chart_name: row.context.chart_name,
      date_created: row.created_at,
      created_by: row.created_by,
      created_by_name: row.created_by_name,
      comment: row.comment,
      resolved: row.resolved,
    }));
  }

  // Fetch ALL climate discussions upfront (optimized approach)
  async getAllClimateDiscussions(): Promise<ClimateComment[]> {
    const { data, error } = await this.discussionsDB
      .select('*')
      .eq('tool', 'climate')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      station_id: row.context.station_id,
      chart_name: row.context.chart_name,
      date_created: row.created_at,
      created_by: row.created_by,
      created_by_name: row.created_by_name,
      comment: row.comment,
      resolved: row.resolved,
    }));
  }

  async updateComment(stationId: string, commentId: string, updatedComment: Partial<ClimateComment>): Promise<void> {
    const updateData: any = {};

    if (updatedComment.comment) {
      updateData.comment = updatedComment.comment;
    }
    if (updatedComment.resolved !== undefined) {
      updateData.resolved = updatedComment.resolved;
    }

    const { error } = await this.discussionsDB.update(updateData).eq('id', commentId);

    if (error) {
      throw error;
    }
  }

  async toggleCommentResolved(stationId: string, commentId: string): Promise<void> {
    // Get current resolved status
    const { data, error: selectError } = await this.discussionsDB.select('resolved').eq('id', commentId).single();

    if (selectError) {
      throw new Error('Comment not found');
    }

    const { error } = await this.discussionsDB.update({ resolved: !data.resolved }).eq('id', commentId);

    if (error) {
      throw error;
    }
  }

  async deleteComment(stationId: string, commentId: string): Promise<void> {
    const { error } = await this.discussionsDB.delete().eq('id', commentId);

    if (error) {
      throw error;
    }
  }
}
