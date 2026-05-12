import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  /** Visual size in pixels for the spinner ring. */
  @Input() size = 32;

  /** Optional label shown below the spinner. Hidden visually if blank, still announced. */
  @Input() label = 'Loading';

  /** Inline (no background) vs overlay (semi-transparent backdrop). */
  @Input() variant: 'inline' | 'overlay' = 'inline';

  get ringStyle(): Record<string, string> {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`,
      borderWidth: `${Math.max(2, Math.round(this.size / 10))}px`,
    };
  }
}
