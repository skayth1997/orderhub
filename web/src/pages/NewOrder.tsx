import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export function NewOrder() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  if (role === 'viewer') {
    return <p className="card">Viewers cannot create orders.</p>;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('orderhub', '/orders', {
        method: 'POST',
        body: { customerName, product, quantity },
      });
      navigate('/orders');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>New order</h1>
      <label>
        Customer name
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </label>
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
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Create order</button>
    </form>
  );
}
