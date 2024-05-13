import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetDrawComponent } from './budget-draw.component';

describe('BudgetDrawComponent', () => {
  let component: BudgetDrawComponent;
  let fixture: ComponentFixture<BudgetDrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetDrawComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetDrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
