// src/app/leader-line.service.ts
import { Injectable } from '@angular/core';

import 'leader-line';
declare let LeaderLine: any;

@Injectable({
  providedIn: 'root',
})
export class LeaderLineService {
  createLine(
    startElement: HTMLElement,
    endElement: HTMLElement,
    options: any = {},
  ): any {
    // Changed LeaderLine to any
    return new LeaderLine(startElement, endElement, options);
  }

  updateLine(
    line: any, // Changed LeaderLine to any
    startElement: HTMLElement,
    endElement: HTMLElement,
    options: any = {},
  ): void {
    line.setOptions({
      start: startElement,
      end: endElement,
      ...options,
    });
  }

  removeLine(line: any): void {
    // Changed LeaderLine to any
    line.remove();
  }
}
