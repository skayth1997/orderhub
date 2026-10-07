import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import {
  Card,
  EmptyState,
  ErrorBox,
  Field,
  PageHeader,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '../ui';

export function NewOrder() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useToast();
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api('orderhub', '/orders', {
        method: 'POST',
        body: {
          customerName: customerName.trim(),
          product: product.trim(),
          quantity: Number(quantity),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      notify('Order created. Its status will update automatically.');
      navigate('/orders');
    },
  });

  if (role === 'viewer') {
    return (
      <Card>
        <EmptyState
          title="You cannot create orders"
          text="Viewers can only read orders. Ask an admin to change your role."
          action={
            <Link to="/orders" className={buttonClass}>
              Back to orders
            </Link>
          }
        />
      </Card>
    );
  }

  const amount = Number(quantity);
  const errors = {
    customerName: customerName.trim() ? undefined : 'Enter the customer name.',
    product: product.trim() ? undefined : 'Enter the product name.',
    quantity:
      Number.isInteger(amount) && amount >= 1 && amount <= 100000
        ? undefined
        : 'Quantity must be a whole number between 1 and 100000.',
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!errors.customerName && !errors.product && !errors.quantity) {
      mutation.mutate();
    }
  }

  return (
    <>
      <PageHeader title="New order" />
      <Card narrow>
        <form onSubmit={submit} noValidate>
          <Field
            label="Customer name"
            error={submitted ? errors.customerName : undefined}
          >
            <input
              className={inputClass}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>
          <Field label="Product" error={submitted ? errors.product : undefined}>
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
          <ErrorBox error={mutation.error} />
          <div className="flex gap-3">
            <button
              className={buttonClass}
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating...' : 'Create order'}
            </button>
            <Link to="/orders" className={secondaryButtonClass}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}
