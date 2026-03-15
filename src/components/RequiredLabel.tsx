import React from "react";

export const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-bold text-foreground">
    {children} <span className="text-destructive">*</span>
  </label>
);

export const OptionalLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-bold text-foreground">
    {children} <span className="text-muted-foreground text-xs font-normal">(optional)</span>
  </label>
);
