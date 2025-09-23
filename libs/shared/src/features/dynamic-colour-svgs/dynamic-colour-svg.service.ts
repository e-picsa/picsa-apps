// skin-tone.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SkinToneService {
  private skinToneSubject = new BehaviorSubject<string>(this.getInitialColor());
  public skinTone$: Observable<string> = this.skinToneSubject.asObservable();

  private getInitialColor(): string {
    return localStorage.getItem('picsa_svg_skin_tone') || '#000000';
  }

  public updateSkinTone(color: string): void {
    localStorage.setItem('picsa_svg_skin_tone', color);
    this.skinToneSubject.next(color);
  }

  public getCurrentSkinTone(): string {
    return this.skinToneSubject.value;
  }
}
