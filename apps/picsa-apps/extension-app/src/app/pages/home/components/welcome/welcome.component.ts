import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'picsa-welcome',
  standalone: true,
  imports: [CommonModule, PicsaTranslateModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class PicsaWelcomeComponent {}
