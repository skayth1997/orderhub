import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import type { Stock as StockRow } from '../api';
import { useAuth } from '../auth';

export function Stock() {
  const { role } = useAuth();
  const [lookup, setLookup] = useState('');
  const [found, setFound] = useState<StockRow | null>(null);
  const [lookupError, setLookupError] = useState('');

  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [saved, setSaved] = useState('');
  const [saveError, setSaveError] = useState('');

  async function search(event: FormEvent) {
    event.preventDefault();
    setFound(null);
    setLookupError('');
    try {
      setFound(
        await api<StockRow>(
          'inventory',
          `/stock/${encodeURIComponent(lookup)}`,
        ),
      );
    } catch (err) {
      setLookupError((err as Error).message);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaved('');
    setSaveError('');
    try {
      await api('inventory', '/stock', {
        method: 'PUT',
        body: { product, quantity },
      });
      setSaved(`Stock for "${product}" is now ${quantity}.`);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  return (
    <>
      <form className="card narrow" onSubmit={search}>
        <h1>Check stock</h1>
        <label>
          Product
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            required
          />
        </label>
        <button type="submit">Check</button>
        {found && (
          <p>
            {found.product}: <strong>{found.quantity}</strong> in stock
          </p>
        )}
        {lookupError && <p className="error">{lookupError}</p>}
      </form>

      {role === 'admin' && (
        <form className="card narrow" onSubmit={save}>
          <h2>Set stock</h2>
          <label>
            Product
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
            />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </label>
          <button type="submit">Save</button>
          {saved && <p className="ok">{saved}</p>}
          {saveError && <p className="error">{saveError}</p>}
        </form>
      )}
    </>
  );
}
