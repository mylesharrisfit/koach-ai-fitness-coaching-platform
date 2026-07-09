import React, { useState } from 'react';
import { CreditCard, Star, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const CARD_BRANDS = {
  visa: { color: '#1A1F71', label: 'Visa' },
  mastercard: { color: '#EB001B', label: 'MC' },
  amex: { color: '#2E77BC', label: 'Amex' },
  default: { color: 'rgb(var(--foreground))', label: '●●●●' },
};

function MockCard({ card, isDefault, onSetDefault, onRemove }) {
  const brand = CARD_BRANDS[card.brand?.toLowerCase()] || CARD_BRANDS.default;
  const expiry = new Date(card.exp_year, card.exp_month - 1);
  const daysToExpiry = differenceInDays(expiry, new Date());
  const expiringSoon = daysToExpiry <= 60 && daysToExpiry > 0;

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${isDefault ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-black" style={{ background: brand.color }}>
            {brand.label}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">●●●● {card.last4}</p>
            <p className="text-white/40 text-xs">Expires {card.exp_month}/{card.exp_year}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDefault && <Star className="w-4 h-4 text-warning fill-warning" />}
          {expiringSoon && <AlertTriangle className="w-4 h-4 text-orange-400" />}
        </div>
      </div>
      {expiringSoon && (
        <p className="text-orange-400 text-[10px] font-semibold mt-2">⚠ Expiring in {daysToExpiry} days — update soon</p>
      )}
      <div className="flex gap-2 mt-3">
        {!isDefault && (
          <button onClick={() => onSetDefault(card.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.15)', color: 'rgb(var(--primary))', border: '1px solid rgba(59,130,246,0.25)' }}>
            Set as default
          </button>
        )}
        {isDefault && (
          <div className="flex-1 py-2 rounded-xl text-xs font-semibold text-center"
            style={{ background: 'rgba(59,130,246,0.1)', color: 'rgb(var(--primary))' }}>
            ★ Default card
          </div>
        )}
        <button onClick={() => onRemove(card.id)}
          className="w-10 h-[34px] rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );
}

export default function BillingPaymentMethods({ client }) {
  const [cards, setCards] = useState([
    { id: '1', brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2027 },
  ]);
  const [defaultCard, setDefaultCard] = useState('1');
  const [showAdd, setShowAdd] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const handleRemove = (id) => {
    if (removeConfirm === id) {
      setCards(c => c.filter(card => card.id !== id));
      if (defaultCard === id) setDefaultCard(cards.find(c => c.id !== id)?.id || null);
      setRemoveConfirm(null);
    } else {
      setRemoveConfirm(id);
      setTimeout(() => setRemoveConfirm(null), 3000);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Saved Cards</p>

      {cards.length === 0 ? (
        <div className="py-8 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No saved payment methods</p>
        </div>
      ) : (
        cards.map(card => (
          <MockCard
            key={card.id}
            card={card}
            isDefault={defaultCard === card.id}
            onSetDefault={setDefaultCard}
            onRemove={handleRemove}
          />
        ))
      )}

      {removeConfirm && (
        <p className="text-destructive text-xs text-center animate-pulse">Tap remove again to confirm deletion</p>
      )}

      <button onClick={() => setShowAdd(s => !s)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '2px dashed rgba(255,255,255,0.12)' }}>
        <Plus className="w-4 h-4" />
        Add New Card
      </button>

      {showAdd && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white/60 text-xs text-center mb-3">🔒 Secured by Stripe — PCI compliant</p>
          <div className="space-y-3">
            <input placeholder="Card number" className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-primary/50" />
            <div className="flex gap-3">
              <input placeholder="MM/YY" className="flex-1 px-4 py-3 rounded-xl text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-primary/50" />
              <input placeholder="CVC" className="flex-1 px-4 py-3 rounded-xl text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-primary/50" />
            </div>
            <input placeholder="Name on card" className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-primary/50" />
          </div>
          <button onClick={() => setShowAdd(false)}
            className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' }}>
            Add Card
          </button>
        </div>
      )}
    </div>
  );
}