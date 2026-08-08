import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import * as authApi from './api';

type Step = 'email' | 'code' | 'password';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const codeSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});
type CodeFormValues = z.infer<typeof codeSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeFormValues>({ resolver: zodResolver(codeSchema) });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmitEmail = async (values: EmailFormValues) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(values.email);
      setEmail(values.email);
      setStep('code');
    } catch (err) {
      setServerError(extractErrorMessage(err, 'Could not send the verification code.'));
    }
  };

  const onSubmitCode = async (values: CodeFormValues) => {
    setServerError(null);
    try {
      const { resetToken: token } = await authApi.verifyResetCode(email, values.code);
      setResetToken(token);
      setStep('password');
    } catch (err) {
      setServerError(extractErrorMessage(err, 'Invalid or expired code.'));
    }
  };

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword(resetToken, values.password);
      setSuccessMessage('Password updated. You can now sign in with your new password.');
    } catch (err) {
      setServerError(extractErrorMessage(err, 'Could not reset your password. Please request a new code.'));
    }
  };

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-[22px] font-semibold tracking-tight text-graphite-900">Password updated</h2>
          <p className="mt-2 text-sm text-graphite-500">{successMessage}</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        {step === 'email' && (
          <>
            <h2 className="text-[22px] font-semibold tracking-tight text-graphite-900">Forgot password</h2>
            <p className="mt-1 text-sm text-graphite-500">
              Enter your account email and we'll send you a verification code.
            </p>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="mt-8 flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@paragonresin.com"
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />
              {serverError && <p className="text-sm text-red-600">{serverError}</p>}
              <Button type="submit" className="mt-2 w-full" isLoading={emailForm.formState.isSubmitting}>
                Send verification code
              </Button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="text-[22px] font-semibold tracking-tight text-graphite-900">Enter verification code</h2>
            <p className="mt-1 text-sm text-graphite-500">
              We sent a 6-digit code to <span className="font-medium text-graphite-700">{email}</span>. It expires in 10 minutes.
            </p>
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="mt-8 flex flex-col gap-4">
              <Input
                label="Verification code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                error={codeForm.formState.errors.code?.message}
                {...codeForm.register('code')}
              />
              {serverError && <p className="text-sm text-red-600">{serverError}</p>}
              <Button type="submit" className="mt-2 w-full" isLoading={codeForm.formState.isSubmitting}>
                Verify code
              </Button>
              <button
                type="button"
                className="mt-1 cursor-pointer text-center text-xs text-graphite-400 hover:text-graphite-600"
                onClick={() => {
                  setServerError(null);
                  setStep('email');
                }}
              >
                Use a different email
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <h2 className="text-[22px] font-semibold tracking-tight text-graphite-900">Set a new password</h2>
            <p className="mt-1 text-sm text-graphite-500">Choose a new password for your account.</p>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="mt-8 flex flex-col gap-4">
              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.password?.message}
                {...passwordForm.register('password')}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              {serverError && <p className="text-sm text-red-600">{serverError}</p>}
              <Button type="submit" className="mt-2 w-full" isLoading={passwordForm.formState.isSubmitting}>
                Reset password
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-graphite-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
