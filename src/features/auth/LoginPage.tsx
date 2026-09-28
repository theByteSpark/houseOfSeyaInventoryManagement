import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Boxes, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from './useAuth';
import { Button, Input } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

const highlights = [
  { icon: Boxes, text: 'Real-time inventory across every warehouse and SKU' },
  { icon: TrendingUp, text: 'Record sales, track revenue, and reorder before you run out' },
  { icon: ShieldCheck, text: 'Role-based access control for your whole team' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: string })?.from ?? '/';
      navigate(from, { replace: true });
    } catch {
      setServerError('Could not sign in. Please check your credentials.');
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      <div className="relative hidden flex-col justify-between bg-brand-800 p-12 text-white lg:col-span-2 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
            <img src="/hos-icon-fluid.png" alt="House of Seya" className="h-[78%] w-[78%] object-contain" />
          </div>
          <span className="text-xl font-semibold tracking-tight">House of Seya</span>
        </div>

        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            Inventory and invoicing,
            <br />
            built for how you actually work.
          </h1>
          <div className="mt-10 flex flex-col gap-5">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <p className="text-sm leading-relaxed text-brand-100">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-brand-200">&copy; {new Date().getFullYear()} House of Seya. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-16 lg:col-span-3">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-mallard-green">
              <img src="/hos-icon-fluid.png" alt="House of Seya" className="h-[78%] w-[78%] object-contain" />
            </div>
            <p className="text-xl font-semibold text-graphite-900">House of Seya</p>
          </div>

          <h2 className="text-[22px] font-semibold tracking-tight text-graphite-900">Sign in</h2>
          <p className="mt-1 text-sm text-graphite-500">Enter your credentials to access your workspace.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@houseofseya.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
            <Link
              to="/forgot-password"
              className="text-center text-xs font-medium text-brand-600 hover:underline"
            >
              Forgot password?
            </Link>
          </form>

          {/* <p className="mt-6 text-center text-xs text-graphite-400">
            Demo workspace — sign in with admin@houseofseya.com / password123.
          </p> */}
        </div>
      </div>
    </div>
  );
}
