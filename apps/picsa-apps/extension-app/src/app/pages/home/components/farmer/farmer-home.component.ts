import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaConfigurationSummaryComponent } from '@picsa/configuration/src';

@Component({
  selector: 'picsa-farmer-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaConfigurationSummaryComponent],
  templateUrl: './farmer-home.component.html',
  styleUrl: './farmer-home.component.scss',
})
export class PicsaFarmerHomeComponent {
  public farmerSteps = [
    {
      id: '',
      slug: 'intro',
      icon_path: '',
      step_number: 1,
      title: 'What is PICSA?',
      tools: [],
      tags: ['Tutorials'],
    },
    {
      id: 'what-do-you-currently-do',
      icon_path: '',
      step_number: 2,
      title: 'What do you currently do?',
      tools: ['seasonal_calendar', 'resource_allocation_map'],
      tags: [],
    },
    {
      id: '',
      slug: 'is-the-climate-changing',
      icon_path: '',
      step_number: 3,
      title: 'Is your climate changing?',
      tools: ['historic_climate'],
      tags: [],
    },
    {
      id: '',
      slug: 'opportunities-and-risk',
      icon_path: '',
      step_number: 4,
      title: 'What are the opportunities and risk?',
      tools: ['probability_and_risk'],
      tags: [],
    },
    {
      id: '',
      slug: 'what-are-the-options',
      icon_path: '',
      step_number: 5,
      title: 'What changes can you make?',
      tools: ['probability_and_risk', 'options'],
      tags: [],
    },
    {
      id: '',
      slug: 'compare-options',
      icon_path: '',
      step_number: 5,
      title: 'Are the changes a good idea?',
      tools: ['options'],
      tags: [],
    },
  ];
}
