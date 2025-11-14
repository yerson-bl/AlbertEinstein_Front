import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListEvaluacionDocenteComponent } from './list-evaluacion-docente.component';

describe('ListEvaluacionDocenteComponent', () => {
  let component: ListEvaluacionDocenteComponent;
  let fixture: ComponentFixture<ListEvaluacionDocenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListEvaluacionDocenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListEvaluacionDocenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
