import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceCreateComponent } from './resource-create.component';

describe('ResourceCreateComponent', () => {
  let component: ResourceCreateComponent;
  let fixture: ComponentFixture<ResourceCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
