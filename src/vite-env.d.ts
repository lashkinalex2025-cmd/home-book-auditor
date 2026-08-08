/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'epubjs' {
  export interface Location {
    start?: { cfi?: string; href?: string; percentage?: number };
    end?: { cfi?: string; href?: string; percentage?: number };
  }

  export interface Themes {
    default(styles: Record<string, Record<string, string>>): void;
    fontSize(size: string): void;
  }

  export interface Rendition {
    display(target?: string): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    destroy(): void;
    themes: Themes;
    on(event: 'relocated', callback: (location: Location) => void): void;
  }

  export interface Book {
    ready: Promise<void>;
    renderTo(
      element: HTMLElement,
      options?: {
        width?: string | number;
        height?: string | number;
        flow?: string;
        allowScriptedContent?: boolean;
      },
    ): Rendition;
    destroy(): void;
  }

  export default function ePub(
    url: string | ArrayBuffer,
    options?: Record<string, unknown>,
  ): Book;
}
