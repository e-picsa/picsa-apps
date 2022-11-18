import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TercilesToolComponent } from './terciles-tool.component';

describe('TercilesToolComponent', () => {
  let component: TercilesToolComponent;
  let fixture: ComponentFixture<TercilesToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TercilesToolComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TercilesToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
