import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 mb-6 md:mb-8 fade-up sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-3xl font-heading font-bold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
}