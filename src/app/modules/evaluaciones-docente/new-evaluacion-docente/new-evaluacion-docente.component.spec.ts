import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEvaluacionDocenteComponent } from './new-evaluacion-docente.component';

describe('NewEvaluacionDocenteComponent', () => {
  let component: NewEvaluacionDocenteComponent;
  let fixture: ComponentFixture<NewEvaluacionDocenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEvaluacionDocenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEvaluacionDocenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
