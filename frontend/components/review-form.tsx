'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, SendHorizonal, Star } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createReview } from '@/lib/api';
import { ReviewPayload, reviewSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';

const inputStyles =
  'w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none transition duration-300 placeholder:text-mist/35 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15';

type ReviewFormProps = {
  onSubmitted?: () => void;
};

export function ReviewForm({ onSubmitted }: ReviewFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReviewPayload>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5
    }
  });

  const rating = watch('rating');

  const onSubmit = async (values: ReviewPayload) => {
    try {
      setServerMessage(null);
      setServerError(null);
      const response = await createReview(values);
      setServerMessage(response.message);
      reset({ customerName: '', comment: '', rating: 5 });
      onSubmitted?.();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Não foi possível enviar a review.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 border-t border-borderSoft pt-6 sm:pt-8">
      <div>
        <label className="mb-2 block text-sm text-mist/70">Nome</label>
        <input className={inputStyles} {...register('customerName')} placeholder="Ex.: João Pereira" />
        {errors.customerName ? <p className="mt-2 text-xs text-rose-300">{errors.customerName.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm text-mist/70">Classificação</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= (hovered || rating);
            return (
              <button
                key={value}
                type="button"
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setValue('rating', value, { shouldValidate: true })}
                className="rounded-full border border-white/10 p-3 transition hover:border-champagne/45"
              >
                <Star className={cn('h-5 w-5', active ? 'fill-champagne text-champagne' : 'text-white/30')} />
              </button>
            );
          })}
        </div>
        {errors.rating ? <p className="mt-2 text-xs text-rose-300">{errors.rating.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm text-mist/70">Comentário</label>
        <textarea
          className={`${inputStyles} min-h-36 resize-none`}
          {...register('comment')}
          placeholder="Conta como foi a tua experiência, o ambiente, o serviço e os pratos favoritos."
        />
        {errors.comment ? <p className="mt-2 text-xs text-rose-300">{errors.comment.message}</p> : null}
      </div>

      {serverMessage ? <div className="border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{serverMessage}</div> : null}
      {serverError ? <div className="border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{serverError}</div> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-canvas transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        {isSubmitting ? 'A enviar...' : 'Enviar review'}
      </button>
    </form>
  );
}
