import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import type { Stock as StockRow } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import {
  Card,
  EmptyState,
  ErrorBox,
  Field,
  PageHeader,
  Pager,
  SkeletonRows,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '../ui';

const LIMIT = 10;

function QuantityLabel({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return <span className="font-medium text-red-600">Out of stock</span>;
  }
  if (quantity <= 5) {
    return <span className="font-medium text-amber-600">{quantity} (low)</span>;
  }
  return <span>{quantity}</span>;
}

export function Stock() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [submitted, setSubmitted] = useState(false);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['stock', page],
    queryFn: () =>
      api<StockRow[]>('inventory', `/stock?page=${page}&limit=${LIMIT}`),
  });
  const rows = data ?? [];

  const save = useMutation({
    mutationFn: () =>
      api('inventory', '/stock', {
        method: 'PUT',
        body: { product: product.trim(), quantity: Number(quantity) },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stock'] });
      notify(`Stock for "${product.trim()}" is now ${Number(quantity)}.`);
      setProduct('');
      setQuantity('0');
      setSubmitted(false);
    },
  });

  const amount = Number(quantity);
  const errors = {
    product: product.trim() ? undefined : 'Enter the product name.',
    quantity:
      Number.isInteger(amount) && amount >= 0
        ? undefined
        : 'Quantity must be a whole number, 0 or more.',
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!errors.product && !errors.quantity) {
      save.mutate();
    }
  }

  return (
    <>
      <PageHeader
        title="Stock"
        subtitle={
          role === 'admin'
            ? 'Set or change the quantity of a product.'
            : 'Products and quantities in stock.'
        }
      />

      {role === 'admin' && (
        <Card title="Set stock" narrow>
          <form onSubmit={submit} noValidate>
            <Field
              label="Product"
              error={submitted ? errors.product : undefined}
            >
              <input
                className={inputClass}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </Field>
            <Field
              label="Quantity"
              error={submitted ? errors.quantity : undefined}
            >
              <input
                className={inputClass}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <ErrorBox error={save.error} />
            <button
              className={buttonClass}
              type="submit"
              disabled={save.isPending}
            >
              {save.isPending ? 'Saving...' : 'Save stock'}
            </button>
          </form>
        </Card>
      )}

      <Card title="Products">
        <ErrorBox error={error} onRetry={() => void refetch()} />
        {isPending && !error && <SkeletonRows />}
        {data && rows.length === 0 && (
          <EmptyState
            title={page === 1 ? 'No products yet' : 'No more products'}
            text={
              page === 1
                ? role === 'admin'
                  ? 'Add a product above to start taking orders.'
                  : 'An admin needs to add products first.'
                : undefined
            }
          />
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="p-2 font-medium">Product</th>
                  <th className="p-2 font-medium">Quantity</th>
                  {role === 'admin' && <th className="p-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product} className="border-b border-slate-100">
                    <td className="p-2">{row.product}</td>
                    <td className="p-2">
                      <QuantityLabel quantity={row.quantity} />
                    </td>
                    {role === 'admin' && (
                      <td className="p-2 text-right">
                        <button
                          className={secondaryButtonClass}
                          onClick={() => {
                            setProduct(row.product);
                            setQuantity(String(row.quantity));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(page > 1 || rows.length > 0) && (
          <Pager
            page={page}
            hasNext={rows.length === LIMIT}
            onChange={setPage}
          />
        )}
      </Card>
    </>
  );
}
