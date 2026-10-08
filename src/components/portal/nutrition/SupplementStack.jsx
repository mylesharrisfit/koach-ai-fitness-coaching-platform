import React from 'react';
import { DisclosureCard } from '@/components/portal/PortalUI';
import { groupSupplements } from '@/lib/supplements';

// The coach's supplements from the client's nutrition plan, grouped by timing
// (src/lib/supplements.js). When the coach hasn't added any, say so — never
// show a generic stack as if it were the client's plan.

function StackSection({ title, items }) {
  return (
    <div className="mb-3 last:mb-0">
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <ul className="mt-1 divide-y divide-border">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 break-words text-sm font-semibold text-foreground">{item.name}</span>
              {item.dose && <span className="text-right text-[13px] text-muted-foreground">{item.dose}</span>}
            </div>
            {item.why && <p className="mt-0.5 text-[13px] text-muted-foreground">{item.why}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SupplementStack({ customSupplements, defaultOpen }) {
  const groups = groupSupplements(customSupplements);
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <DisclosureCard
      title="Supplements"
      sub={count ? `${count} from your coach` : 'None on your plan yet'}
      defaultOpen={defaultOpen}
    >
      {count === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Your coach hasn't added supplements to your plan. Ask them in messages if you're unsure what to take.
        </p>
      ) : (
        groups.map((g) => <StackSection key={g.title} title={g.title} items={g.items} />)
      )}
    </DisclosureCard>
  );
}
