'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import BrandLogo from '@/app/components/BrandLogo';
import SplashIntro from '@/app/components/SplashIntro';
import signIn from '@/app/firebase/auth/signin';
import { cn } from '@/lib/utils';

export default function SigninPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [splashDone, setSplashDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setError('');
    const { result, error: signInError } = await signIn(values.email, values.password);
    if (signInError || !result) {
      setError('Неверный email или пароль');
      return;
    }
    router.push('/categories');
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <SplashIntro onFinished={() => setSplashDone(true)} />
      <div
        className={cn('w-full max-w-md', splashDone && 'animate-fade-in-up', !splashDone && 'pointer-events-none')}
        aria-hidden={!splashDone}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo size={80} />
          </div>
          <p className="text-sm text-muted-foreground">Вход в админ-панель</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-foreground/90">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                error={Boolean(errors.email)}
                {...register('email', { required: 'Email обязателен' })}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-foreground/90">
                Пароль
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  error={Boolean(errors.password)}
                  {...register('password', { required: 'Пароль обязателен' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="mt-6 w-full" size="lg" disabled={isSubmitting}>
              <Lock className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
