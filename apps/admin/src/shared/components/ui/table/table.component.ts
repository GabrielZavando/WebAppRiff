import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * List table base (ported from TailAdmin's `ui/table`, task 1.4 / design D4),
 * adapted to the Riff design system: `@theme` tokens, square corners, no
 * elevations, light-only.
 *
 * The page projects `<tr appTableHeaderRow>` (header row) and `<tr appTableRow>`
 * elements as direct children (column sets differ per domain); this component
 * owns the framing, the `<thead>`/`<tbody>` styling and the empty state.
 * Actions per row are projected inside the row cells by the page.
 */
@Component({
  selector: 'app-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-table-wrapper class="overflow-x-auto border border-border bg-white">
      <table class="w-full text-left text-sm" data-testid="table">
        <thead class="bg-bg text-xs uppercase font-heading text-text-2">
          <ng-content select="tr[appTableHeaderRow]"></ng-content>
        </thead>
        <tbody>
          <ng-content select="tr[appTableRow]"></ng-content>
        </tbody>
      </table>
      @if (empty) {
        <div
          data-table-empty
          class="border-t border-border px-4 py-8 text-center text-sm text-text-2"
        >
          {{ emptyMessage }}
        </div>
      }
    </div>
  `,
})
export class TableComponent {
  @Input() empty = false;
  @Input() emptyMessage = 'Sin resultados';
}
