import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal.component';

/**
 * Confirmation modal (task 1.3 / design D4): flat design on Riff tokens,
 * Esc and cancel both dismiss, confirm emits once, Tab focus wraps inside the
 * dialog.
 */
describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;

  function render(): void {
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Eliminar producto');
    fixture.componentRef.setInput('message', 'Esta acción no se puede deshacer.');
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ModalComponent] });
  });

  it('renders title, message and the action buttons', () => {
    render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[role="dialog"]')).not.toBeNull();
    expect(el.querySelector('h3')?.textContent).toContain('Eliminar producto');
    expect(el.textContent).toContain('Esta acción no se puede deshacer.');
    expect(el.textContent).toContain('Cancelar');
    expect(el.textContent).toContain('Eliminar');
  });

  it('emits confirmed exactly once on confirm', () => {
    render();
    const confirmed = vi.fn();
    component.confirmed.subscribe(confirmed);

    const confirmButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-modal-confirm]',
    ) as HTMLButtonElement;
    confirmButton.click();

    expect(confirmed).toHaveBeenCalledTimes(1);
  });

  it('emits cancelled on cancel button without confirming', () => {
    render();
    const cancelled = vi.fn();
    const confirmed = vi.fn();
    component.cancelled.subscribe(cancelled);
    component.confirmed.subscribe(confirmed);

    const cancelButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-modal-cancel]',
    ) as HTMLButtonElement;
    cancelButton.click();

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('emits cancelled on Escape', () => {
    render();
    const cancelled = vi.fn();
    component.cancelled.subscribe(cancelled);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('focuses the cancel button when opened (safe default for destructive actions)', () => {
    render();
    const cancelButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-modal-cancel]',
    ) as HTMLButtonElement;

    expect(document.activeElement).toBe(cancelButton);
  });

  it('wraps Tab focus between the two action buttons (focus trap)', () => {
    render();
    const el = fixture.nativeElement as HTMLElement;
    const cancelButton = el.querySelector('[data-modal-cancel]') as HTMLButtonElement;
    const confirmButton = el.querySelector('[data-modal-confirm]') as HTMLButtonElement;

    confirmButton.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.activeElement).toBe(cancelButton);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.activeElement).toBe(confirmButton);
  });
});
