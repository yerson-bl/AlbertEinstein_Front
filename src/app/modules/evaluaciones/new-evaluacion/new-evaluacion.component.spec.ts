import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEvaluacionComponent } from './new-evaluacion.component';

describe('NewEvaluacionComponent', () => {
  let component: NewEvaluacionComponent;
  let fixture: ComponentFixture<NewEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEvaluacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEvaluacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
