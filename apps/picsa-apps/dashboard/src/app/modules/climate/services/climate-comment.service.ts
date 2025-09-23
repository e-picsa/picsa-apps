import { Injectable } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateComment } from '../components/comment-dialog/comment-dialog.component';
import { IClimateStationData } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ClimateCommentService {
  constructor(private supabaseService: SupabaseService) {}

  private get stationDataDB() {
    return this.supabaseService.db.table<'climate_station_data', IClimateStationData>('climate_station_data');
  }

  async submitComment(stationId: string, comment: ClimateComment): Promise<void> {
    // Get existing comments
    const existingComments = await this.getComments(stationId);
    const updatedComments = [...existingComments, comment];

    // Update the station data with new comment
    const { error } = await this.stationDataDB.update({ comments: updatedComments as any }).eq('station_id', stationId);

    if (error) {
      throw error;
    }
  }

  async getComments(stationId: string): Promise<ClimateComment[]> {
    const { data, error } = await this.stationDataDB.select('comments').eq('station_id', stationId).maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.comments as unknown as ClimateComment[]) || [];
  }

  async updateComment(stationId: string, commentId: string, updatedComment: Partial<ClimateComment>): Promise<void> {
    const existingComments = await this.getComments(stationId);
    const commentIndex = existingComments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const updatedComments = [...existingComments];
    updatedComments[commentIndex] = { ...updatedComments[commentIndex], ...updatedComment };

    const { error } = await this.stationDataDB.update({ comments: updatedComments as any }).eq('station_id', stationId);

    if (error) {
      throw error;
    }
  }

  async toggleCommentResolved(stationId: string, commentId: string): Promise<void> {
    const existingComments = await this.getComments(stationId);
    const comment = existingComments.find((c) => c.id === commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    await this.updateComment(stationId, commentId, { resolved: !comment.resolved });
  }

  async deleteComment(stationId: string, commentId: string): Promise<void> {
    const existingComments = await this.getComments(stationId);
    const updatedComments = existingComments.filter((c) => c.id !== commentId);

    const { error } = await this.stationDataDB.update({ comments: updatedComments as any }).eq('station_id', stationId);

    if (error) {
      throw error;
    }
  }
}
