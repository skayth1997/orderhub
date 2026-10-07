import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Card, ErrorText, Field, buttonClass, inputClass } from '../ui';

export function NewOrder() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  const mutation = useMutation({
    mutationFn: () =>
      api('orderhub', '/orders', {
        method: 'POST',
        body: { customerName, product, quantity },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders');
    },
  });

  if (role === 'viewer') {
    return <Card>Viewers cannot create orders.</Card>;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Card title="New order" narrow>
      <form onSubmit={submit}>
        <Field label="Customer name">
          <input
            className={inputClass}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </Field>
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
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </Field>
        <ErrorText error={mutation.error} />
        <button
          className={buttonClass}
          type="submit"
          disabled={mutation.isPending}
        >
          Create order
        </button>
      </form>
    </Card>
  );
}
