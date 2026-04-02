import type { ReactNode } from 'react';

type AppPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Shared chrome for authenticated placeholder pages (glass panel + heading). */
export function AppPageShell({ title, description, children }: AppPageShellProps) {
  return (
    <div className="mm-page animate-fade-in">
      <header className="mm-page__header">
        <h1 className="mm-page__title">{title}</h1>
        {description ? <p className="mm-page__desc">{description}</p> : null}
      </header>
      <div className="glass-container mm-page__panel">{children}</div>
    </div>
  );
}
