import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaEvaluacionesComponent } from './lista-evaluaciones.component';

describe('ListaEvaluacionesComponent', () => {
  let component: ListaEvaluacionesComponent;
  let fixture: ComponentFixture<ListaEvaluacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEvaluacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaEvaluacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
