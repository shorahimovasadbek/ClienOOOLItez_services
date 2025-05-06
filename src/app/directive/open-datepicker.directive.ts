import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appOpenDatepicker]',
})
export class OpenDatepickerDirective {
  constructor(private el: ElementRef) { }

  @HostListener('click')
  onClick(): void {
    const input: HTMLInputElement = this.el.nativeElement;

    if (input.showPicker) {
      input.showPicker();
    } else {
      setTimeout(() => input.click(), 50);
    }
  }
}
