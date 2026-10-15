import { describe, expect, it, beforeEach } from "vitest";
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableComponent } from './table.component';

/**
 * List table base (task 1.4 / design D4): header and rows are projected by
 * the pages; the component owns the empty state and the flat design.
 */
@Component({
  selector: 'app-table-host',
  imports: [TableComponent],
  template: `
    <app-table [empty]="empty" emptyMessage="Sin resultados">
      <tr appTableHeaderRow>
        <th class="px-4 py-3">Nombre</th>
        <th class="px-4 py-3">Activa</th>
      </tr>
      <tr appTableRow>
        <td class="px-4 py-3">Categoría A</td>
        <td class="px-4 py-3">Sí</td>
      </tr>
      <tr appTableRow>
        <td class="px-4 py-3">Categoría B</td>
        <td class="px-4 py-3">No</td>
      </tr>
    </app-table>
  `,
})
class TableHostComponent {
  empty = false;
}

describe('TableComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TableHostComponent] });
  });

  function render(empty: boolean): {
    fixture: ComponentFixture<TableHostComponent>;
    el: HTMLElement;
    host: TableHostComponent;
  } {
    const fixture = TestBed.createComponent(TableHostComponent);
    fixture.componentInstance.empty = empty;
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      host: fixture.componentInstance,
    };
  }

  it('projects the header and the rows', () => {
    const { el } = render(false);

    expect(el.querySelector('table')).not.toBeNull();
    expect(el.querySelectorAll('thead th').length).toBe(2);
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.textContent).toContain('Categoría A');
  });

  it('shows the empty state only when empty is true', () => {
    const empty = render(true);
    expect(empty.el.querySelector('[data-table-empty]')?.textContent).toContain('Sin resultados');

    const filled = render(false);
    expect(filled.el.querySelector('[data-table-empty]')).toBeNull();
  });

  it('keeps the flat design: no rounded corners, no shadows', () => {
    const { el } = render(false);
    const wrapper = el.querySelector('[data-table-wrapper]') as HTMLElement;

    expect(wrapper.className).not.toMatch(/rounded/);
    expect(wrapper.className).not.toMatch(/shadow/);
  });
});
