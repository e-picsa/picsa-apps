import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaConfigurationSummaryComponent } from '@picsa/configuration/src';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaConfigurationSummaryComponent, PicsaTranslateModule],
  templateUrl: './farmer-home.component.html',
  styleUrl: './farmer-home.component.scss',
})
export class PicsaFarmerHomeComponent {
  public farmerSteps = FARMER_CONTENT_DATA;
}
