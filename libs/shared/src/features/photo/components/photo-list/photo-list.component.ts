import { Component, computed, input } from '@angular/core';

import { PicsaTranslateModule } from '../../../../modules';
import { PhotoService } from '../../photo.service';
import { PhotoViewComponent } from '../photo-view/photo-view.component';

@Component({
  selector: 'picsa-photo-list',
  imports: [PhotoViewComponent, PicsaTranslateModule],
  templateUrl: './photo-list.component.html',
  styleUrl: './photo-list.component.scss',
})
export class PhotoListComponent {
  album = input<string>();

  photos = computed(() => {
    const album = this.album();
    const photoDocs = this.service.photos();
    return album ? photoDocs.filter((d) => d.album === album) : photoDocs;
  });

  constructor(private service: PhotoService) {}
}
