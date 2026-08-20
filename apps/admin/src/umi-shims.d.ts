export {};

declare module "@umijs/max" {
  import type { ComponentType, ReactNode } from "react";
  export const history: {
    location: { pathname: string; search: string; hash: string };
    replace: (path: string) => void;
    push: (path: string) => void;
  };
  export const Link: ComponentType<{ to: string; children?: ReactNode }>;
}
