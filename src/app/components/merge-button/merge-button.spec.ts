import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeButton } from './merge-button';

describe('MergeButton', () => {
  let component: MergeButton;
  let fixture: ComponentFixture<MergeButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeButton],
    }).compileComponents();

    fixture = TestBed.createComponent(MergeButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
