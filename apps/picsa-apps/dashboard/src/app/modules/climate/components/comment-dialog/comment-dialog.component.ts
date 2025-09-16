import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateCommentService } from '../../services/climate-comment.service';

export interface CommentDialogData {
  stationId: string;
  stationName: string;
  chartName: string;
  editComment?: ClimateComment;
  isEditMode?: boolean;
}

export interface ClimateComment {
  id: string;
  station_id: string;
  chart_name: string;
  date_created: string;
  created_by: string;
  created_by_name: string;
  comment: string;
  resolved?: boolean;
}

@Component({
  selector: 'dashboard-climate-comment-dialog',
  templateUrl: './comment-dialog.component.html',
  styleUrls: ['./comment-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class ClimateCommentDialogComponent {
  commentForm: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<ClimateCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CommentDialogData,
    private fb: FormBuilder,
    private commentService: ClimateCommentService,
    private supabaseService: SupabaseService,
  ) {
    const initialValue = this.data.editComment?.comment || '';
    this.commentForm = this.fb.group({
      comment: [initialValue, [Validators.required, Validators.minLength(5)]],
    });
  }

  async onSubmit() {
    if (this.commentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        if (this.data.isEditMode && this.data.editComment) {
          // Edit existing comment
          await this.commentService.updateComment(this.data.stationId, this.data.editComment.id, {
            comment: this.commentForm.value.comment,
          });
          this.dialogRef.close({ ...this.data.editComment, comment: this.commentForm.value.comment });
        } else {
          // Create new comment
          const currentUser = this.supabaseService.auth.authUser();
          const comment: ClimateComment = {
            id: crypto.randomUUID(),
            station_id: this.data.stationId,
            chart_name: this.data.chartName,
            date_created: new Date().toISOString(),
            created_by: currentUser?.id || 'anonymous',
            created_by_name: currentUser?.email || currentUser?.user_metadata?.name || 'Anonymous User',
            comment: this.commentForm.value.comment,
            resolved: false,
          };

          await this.commentService.submitComment(this.data.stationId, comment);
          this.dialogRef.close(comment);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
