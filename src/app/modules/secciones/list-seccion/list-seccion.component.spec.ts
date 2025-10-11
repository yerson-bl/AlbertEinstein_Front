import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSeccionComponent } from './list-seccion.component';

describe('ListSeccionComponent', () => {
  let component: ListSeccionComponent;
  let fixture: ComponentFixture<ListSeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
