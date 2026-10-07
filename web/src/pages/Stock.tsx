import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import type { Stock as StockRow } from '../api';
import { useAuth } from '../auth';
import { Card, ErrorText, Field, buttonClass, inputClass } from '../ui';

export function Stock() {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [lookup, setLookup] = useState('');
  const [searched, setSearched] = useState('');
  const found = useQuery({
    queryKey: ['stock', searched],
    queryFn: () =>
      api<StockRow>('inventory', `/stock/${encodeURIComponent(searched)}`),
    enabled: searched !== '',
  });

  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const save = useMutation({
    mutationFn: () =>
      api('inventory', '/stock', {
        method: 'PUT',
        body: { product, quantity },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock'] }),
  });

  function search(event: FormEvent) {
    event.preventDefault();
    setSearched(lookup);
  }

  function submitSave(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <>
      <Card title="Check stock" narrow>
        <form onSubmit={search}>
          <Field label="Product">
            <input
              className={inputClass}
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              required
            />
          </Field>
          <button className={buttonClass} type="submit">
            Check
          </button>
        </form>
        {found.data && (
          <p className="mt-3 text-sm">
            {found.data.product}: <strong>{found.data.quantity}</strong> in
            stock
          </p>
        )}
        <div className="mt-3">
          <ErrorText error={found.error} />
        </div>
      </Card>

      {role === 'admin' && (
        <Card title="Set stock" narrow>
          <form onSubmit={submitSave}>
            <Field label="Product">
              <input
                className={inputClass}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
              />
            </Field>
            <Field label="Quantity">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </Field>
            <ErrorText error={save.error} />
            <button
              className={buttonClass}
              type="submit"
              disabled={save.isPending}
            >
              Save
            </button>
            {save.isSuccess && (
              <p className="mt-3 text-sm text-green-700">Saved.</p>
            )}
          </form>
        </Card>
      )}
    </>
  );
}
