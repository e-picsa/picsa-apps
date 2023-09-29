import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCalenderComponent } from './create-calender.component';

describe('CreateCalenderComponent', () => {
  let component: CreateCalenderComponent;
  let fixture: ComponentFixture<CreateCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateCalenderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
