import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDocentesComponent } from './list-docentes.component';

describe('ListDocentesComponent', () => {
  let component: ListDocentesComponent;
  let fixture: ComponentFixture<ListDocentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDocentesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListDocentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
