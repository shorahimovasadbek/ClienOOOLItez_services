import {
    Directive,
    ElementRef,
    HostListener,
    Renderer2
  } from '@angular/core';
  
  @Directive({
    selector: '[appTableScroll]'
  })
  export class TableScrollDirective {
    constructor(private el: ElementRef, private renderer: Renderer2) {}
  
    @HostListener('scroll', ['$event'])
    onScroll(event: Event) {
      const scrollTop = (event.target as HTMLElement).scrollTop;
      const directiveRoot = this.el.nativeElement.closest('.wrapper') as HTMLElement;

      const contentHeader = directiveRoot?.previousElementSibling as HTMLElement;
      const balancesList = directiveRoot.querySelector('.amount-balances-list') as HTMLElement;
      
      const tableContainer = this.el.nativeElement.closest('.table-wrapper') as HTMLElement;
      const filterContainer = this.el.nativeElement.closest('.wrapper')?.querySelector('.content-filter') as HTMLElement;
      const menuContainer = document.querySelector('.menu') as HTMLElement;
      if (menuContainer && tableContainer && filterContainer) {
        const menuWidth = menuContainer.offsetWidth;
        const menuIsOpen = menuContainer.classList.contains('close');
        const leftValue = `${menuIsOpen ? menuWidth : 210 + 10}px`;
  
        if (scrollTop > 100) {
          this.renderer.setStyle(filterContainer, 'position', 'fixed');
          this.renderer.setStyle(filterContainer, 'top', '70px');
          this.renderer.setStyle(filterContainer, 'left', leftValue);
          this.renderer.setStyle(filterContainer, 'z-index', '1000');
          this.renderer.setStyle(filterContainer, 'transition', 'all 0.3s ease-in-out');
          this.renderer.setStyle(tableContainer, 'position', 'fixed');
          this.renderer.setStyle(tableContainer, 'top', '120px');
          this.renderer.setStyle(tableContainer, 'left', leftValue);
          this.renderer.setStyle(tableContainer, 'z-index', '999');
          this.renderer.setStyle(tableContainer, 'transition', 'all 0.3s ease-in-out');
          if (contentHeader) {
            this.renderer.setStyle(contentHeader, 'display', 'none');
            this.renderer.setStyle(balancesList, 'display', 'none');
          }
          this.updateWidth(tableContainer, filterContainer, menuIsOpen, menuContainer);
        } else {
          this.removeFixedStyles(tableContainer);
          this.removeFixedStyles(filterContainer);
          if (contentHeader) {
            this.renderer.removeStyle(contentHeader, 'display');
            this.renderer.removeStyle(balancesList, 'display');
          }
        }
      }
    }
  
    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
      const tableContainer = this.el.nativeElement.closest('.table-wrapper') as HTMLElement;
      const filterContainer = this.el.nativeElement.closest('.wrapper')?.querySelector('.content-filter') as HTMLElement;
      const menuContainer = document.querySelector('.menu') as HTMLElement;
  
      if (tableContainer && filterContainer && menuContainer) {
        const menuIsOpen = menuContainer.classList.contains('open');
        if (tableContainer.style.position === 'fixed') {
          this.updateWidth(tableContainer, filterContainer, menuIsOpen, menuContainer);
        }
      }
    }
  
    private updateWidth(
      tableContainer: HTMLElement,
      filterContainer: HTMLElement,
      menuIsOpen: boolean,
      menuContainer: HTMLElement
    ) {
      const screenWidth = window.innerWidth;
      let widthValue = '';
  
      if (screenWidth <= 1024) {
        this.removeFixedStyles(tableContainer);
        this.removeFixedStyles(filterContainer);
      } else if (screenWidth <= 1280) {
        widthValue = menuIsOpen ? `calc(100vw - ${menuContainer.offsetWidth}px)` : '78vw';
      } else if (screenWidth <= 1480) {
        widthValue = menuIsOpen ? `calc(100vw - ${menuContainer.offsetWidth}px)` : '85vw';
      } else {
        widthValue = menuIsOpen ? `calc(100vw - ${menuContainer.offsetWidth}px)` : '86vw';
      }
  
      if (widthValue) {
        this.renderer.setStyle(tableContainer, 'width', widthValue);
        this.renderer.setStyle(tableContainer, 'max-height', '88vh');
        this.renderer.setStyle(filterContainer, 'width', widthValue);
      }
    }
  
    private removeFixedStyles(element: HTMLElement | null) {
      if (!element) return;
      this.renderer.setStyle(element, 'transition', 'all 0.3s ease-in-out');
      this.renderer.removeStyle(element, 'position');
      this.renderer.removeStyle(element, 'top');
      this.renderer.removeStyle(element, 'left');
      this.renderer.removeStyle(element, 'width');
      this.renderer.removeStyle(element, 'max-height');
      this.renderer.removeStyle(element, 'z-index');
    }
  }
  