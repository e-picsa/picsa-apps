import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

interface IReceivedVideoItem {
  id: string;
  title: string;
  moduleTitle: string;
}

// TODO - mock data for UI purposes only, replace once the native receiving plugin is wired up
const MOCK_RECEIVED_VIDEOS: IReceivedVideoItem[] = [
  { id: '1', title: 'Introduction to PICSA', moduleTitle: 'Module 1: Getting Started' },
  { id: '2', title: 'Understanding Seasonal Forecasts', moduleTitle: 'Module 2: Climate Information' },
  { id: '3', title: 'Planning Your Planting Calendar', moduleTitle: 'Module 3: Crop Planning' },
];

@Component({
  selector: 'farmer-content-share-receive',
  imports: [MatIconModule, PicsaTranslateModule],
  templateUrl: './share-receive.component.html',
  styleUrl: './share-receive.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareReceiveComponent {
  public readonly receivedVideos = signal<IReceivedVideoItem[]>(MOCK_RECEIVED_VIDEOS);
}
