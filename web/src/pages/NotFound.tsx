import { Link } from 'react-router-dom';
import { buttonClass } from '../ui';

export function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        The page you are looking for does not exist.
      </p>
      <Link to="/orders" className={`${buttonClass} mt-6`}>
        Back to orders
      </Link>
    </div>
  );
}
