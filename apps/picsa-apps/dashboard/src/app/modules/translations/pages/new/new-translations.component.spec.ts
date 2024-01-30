import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewTranslationsComponent } from './new-translations.component'

describe('NewTranslationsComponent', () => {
  let component: NewTranslationsComponent;
  let fixture: ComponentFixture<NewTranslationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewTranslationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewTranslationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
