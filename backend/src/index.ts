import { reviewSchema } from './validators/review.validator';
import {
  manualReservationSchema,
  operationalBlockSchema,
  operationalBlockToggleSchema,
  reservationAvailabilitySchema,
  reservationSchema,
  reservationSettingsSchema,
  reservationStatusSchema,
  reservationUpdateSchema
} from './validators/reservation.validator';
import {
  createWorkerReview,
  deleteWorkerReview,
  listWorkerReviews
} from './services/review.worker.service';
import {
  createWorkerManualReservation,
  createWorkerOperationalBlock,
  createWorkerReservation,
  deleteWorkerOperationalBlock,
  deleteWorkerReservation,
  getWorkerOperationalBlocks,
  getWorkerReservationAvailability,
  getWorkerReservationById,
  getWorkerReservationDashboardSummary,
  getWorkerReservationSettings,
  getWorkerReservations,
  isWorkerReservationError,
  toggleWorkerOperationalBlock,
  updateWorkerReservation,
  updateWorkerReservationSettings,
  updateWorkerReservationStatus
} from './services/reservation.worker.service';

type Env = {
  ADMIN_ACCESS_KEY?: string;
  CLIENT_ORIGIN?: string;
  MAIL_FROM?: string;
  MONGODB_URI?: string;
  SMTP_HOST?: string;
  SMTP_PASS?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
};

function corsHeaders(origin: string, headers?: HeadersInit) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    ...Object.fromEntries(new Headers(headers).entries())
  };
}

function json(data: unknown, origin: string, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: corsHeaders(origin, init?.headers)
  });
}

function getAllowedOrigin(request: Request, env: Env) {
  const requestOrigin = request.headers.get('Origin');

  if (env.CLIENT_ORIGIN && requestOrigin === env.CLIENT_ORIGIN) {
    return env.CLIENT_ORIGIN;
  }

  return env.CLIENT_ORIGIN ?? '*';
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError('JSON inválido.', 400);
  }
}

function queryValue(url: URL, key: string) {
  return url.searchParams.get(key) ?? undefined;
}

function requireMongoUri(env: Env) {
  if (!env.MONGODB_URI) {
    throw new HttpError('Missing Worker binding: MONGODB_URI', 500);
  }

  return env.MONGODB_URI;
}

function ensureAdmin(request: Request, env: Env) {
  const key = request.headers.get('x-admin-key');

  if (!key || key !== env.ADMIN_ACCESS_KEY) {
    throw new HttpError('Acesso não autorizado.', 401);
  }
}

class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function handleReviews(request: Request, env: Env, origin: string, pathname: string) {
  const mongoUri = requireMongoUri(env);

  if (request.method === 'GET' && pathname === '/api/reviews') {
    const reviews = await listWorkerReviews(mongoUri);
    return json({ reviews }, origin);
  }

  if (request.method === 'POST' && pathname === '/api/reviews') {
    const body = await readJson(request);
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { message: parsed.error.issues[0]?.message ?? 'Dados de review inválidos.' },
        origin,
        { status: 400 }
      );
    }

    await createWorkerReview(mongoUri, parsed.data);
    return json({ message: 'Review publicada com sucesso no website.' }, origin, { status: 201 });
  }

  const reviewIdMatch = pathname.match(/^\/api\/reviews\/([^/]+)$/);
  if (request.method === 'DELETE' && reviewIdMatch) {
    ensureAdmin(request, env);
    const review = await deleteWorkerReview(mongoUri, reviewIdMatch[1]);

    if (!review) {
      return json({ message: 'Review não encontrada.' }, origin, { status: 404 });
    }

    return json({ message: 'Review removida com sucesso.' }, origin);
  }

  return null;
}

async function handleReservations(request: Request, env: Env, origin: string, url: URL, pathname: string) {
  const mongoUri = requireMongoUri(env);

  if (request.method === 'GET' && pathname === '/api/reservations/availability') {
    const parsed = reservationAvailabilitySchema.safeParse({
      date: queryValue(url, 'date'),
      guests: queryValue(url, 'guests'),
      zone: queryValue(url, 'zone')
    });

    if (!parsed.success) {
      return json({ message: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.' }, origin, { status: 400 });
    }

    const availability = await getWorkerReservationAvailability(
      mongoUri,
      parsed.data.date,
      parsed.data.guests,
      parsed.data.zone
    );

    return json(availability, origin);
  }

  if (request.method === 'POST' && pathname === '/api/reservations') {
    const body = await readJson(request);
    const parsed = reservationSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { message: parsed.error.issues[0]?.message ?? 'Dados de reserva inválidos.' },
        origin,
        { status: 400 }
      );
    }

    const { consent, ...payload } = parsed.data;

    try {
      const result = await createWorkerReservation(
        mongoUri,
        {
          ...payload,
          consentAccepted: consent
        },
        env
      );

      return json(
        {
          message:
            'Reserva confirmada com sucesso. Enviámos confirmação imediata por email sempre que configurado.',
          reservation: result.reservation,
          suggestions: result.suggestions
        },
        origin,
        { status: 201 }
      );
    } catch (error) {
      return handleKnownError(error, origin);
    }
  }

  if (pathname === '/api/reservations' || pathname.startsWith('/api/reservations/')) {
    if (request.method === 'POST' && pathname === '/api/reservations/manual') {
      ensureAdmin(request, env);
      const body = await readJson(request);
      const parsed = manualReservationSchema.safeParse(body);

      if (!parsed.success) {
        return json(
          { message: parsed.error.issues[0]?.message ?? 'Dados de reserva inválidos.' },
          origin,
          { status: 400 }
        );
      }

      try {
        const result = await createWorkerManualReservation(mongoUri, parsed.data, env);
        return json(
          {
            message: 'Reserva telefónica confirmada com sucesso.',
            reservation: result.reservation,
            suggestions: result.suggestions
          },
          origin,
          { status: 201 }
        );
      } catch (error) {
        return handleKnownError(error, origin);
      }
    }

    if (request.method === 'GET' && pathname === '/api/reservations/settings') {
      ensureAdmin(request, env);
      const settings = await getWorkerReservationSettings(mongoUri);
      return json({ settings }, origin);
    }

    if (request.method === 'PATCH' && pathname === '/api/reservations/settings') {
      ensureAdmin(request, env);
      const body = await readJson(request);
      const parsed = reservationSettingsSchema.safeParse(body);

      if (!parsed.success) {
        return json({ message: parsed.error.issues[0]?.message ?? 'Configuração inválida.' }, origin, {
          status: 400
        });
      }

      const settings = await updateWorkerReservationSettings(mongoUri, parsed.data);
      return json({ message: 'Configurações atualizadas com sucesso.', settings }, origin);
    }

    if (request.method === 'GET' && pathname === '/api/reservations/blocks') {
      ensureAdmin(request, env);
      const blocks = await getWorkerOperationalBlocks(mongoUri, {
        date: queryValue(url, 'date'),
        zone: (queryValue(url, 'zone') as 'interior' | 'terrace' | undefined) ?? undefined
      });

      return json({ blocks }, origin);
    }

    if (request.method === 'POST' && pathname === '/api/reservations/blocks') {
      ensureAdmin(request, env);
      const body = await readJson(request);
      const parsed = operationalBlockSchema.safeParse(body);

      if (!parsed.success) {
        return json({ message: parsed.error.issues[0]?.message ?? 'Bloqueio inválido.' }, origin, { status: 400 });
      }

      try {
        const block = await createWorkerOperationalBlock(mongoUri, parsed.data);
        return json({ message: 'Bloqueio criado com sucesso.', block }, origin, { status: 201 });
      } catch (error) {
        return handleKnownError(error, origin);
      }
    }

    const blockIdMatch = pathname.match(/^\/api\/reservations\/blocks\/([^/]+)$/);
    if (blockIdMatch) {
      ensureAdmin(request, env);

      if (request.method === 'PATCH') {
        const body = await readJson(request);
        const parsed = operationalBlockToggleSchema.safeParse(body);

        if (!parsed.success) {
          return json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, origin, {
            status: 400
          });
        }

        const block = await toggleWorkerOperationalBlock(mongoUri, blockIdMatch[1], parsed.data.active);

        if (!block) {
          return json({ message: 'Bloqueio não encontrado.' }, origin, { status: 404 });
        }

        return json({ message: 'Bloqueio atualizado com sucesso.', block }, origin);
      }

      if (request.method === 'DELETE') {
        const block = await deleteWorkerOperationalBlock(mongoUri, blockIdMatch[1]);

        if (!block) {
          return json({ message: 'Bloqueio não encontrado.' }, origin, { status: 404 });
        }

        return json({ message: 'Bloqueio removido com sucesso.' }, origin);
      }
    }

    if (request.method === 'GET' && pathname === '/api/reservations/dashboard') {
      ensureAdmin(request, env);
      const date = queryValue(url, 'date');

      if (!date) {
        return json({ message: 'Indica uma data para o painel.' }, origin, { status: 400 });
      }

      const summary = await getWorkerReservationDashboardSummary(
        mongoUri,
        date,
        (queryValue(url, 'zone') as 'interior' | 'terrace' | undefined) ?? undefined,
        queryValue(url, 'time') ?? undefined
      );

      return json(summary, origin);
    }

    if (request.method === 'GET' && pathname === '/api/reservations') {
      ensureAdmin(request, env);
      const reservations = await getWorkerReservations(mongoUri, {
        date: queryValue(url, 'date'),
        zone: (queryValue(url, 'zone') as 'interior' | 'terrace' | undefined) ?? undefined,
        status:
          (queryValue(url, 'status') as
            | 'confirmed_auto'
            | 'cancelled_by_customer'
            | 'cancelled_by_restaurant'
            | 'completed'
            | 'no_show'
            | undefined) ?? undefined,
        search: queryValue(url, 'search')
      });

      return json({ reservations }, origin);
    }

    const reservationStatusMatch = pathname.match(/^\/api\/reservations\/([^/]+)\/status$/);
    if (reservationStatusMatch && request.method === 'PATCH') {
      ensureAdmin(request, env);
      const body = await readJson(request);
      const parsed = reservationStatusSchema.safeParse(body);

      if (!parsed.success) {
        return json({ message: parsed.error.issues[0]?.message ?? 'Estado inválido.' }, origin, { status: 400 });
      }

      const reservation = await updateWorkerReservationStatus(
        mongoUri,
        reservationStatusMatch[1],
        parsed.data.status
      );

      if (!reservation) {
        return json({ message: 'Reserva não encontrada.' }, origin, { status: 404 });
      }

      return json({ message: 'Estado da reserva atualizado com sucesso.', reservation }, origin);
    }

    const reservationIdMatch = pathname.match(/^\/api\/reservations\/([^/]+)$/);
    if (reservationIdMatch) {
      ensureAdmin(request, env);
      const reservationId = reservationIdMatch[1];

      if (request.method === 'GET') {
        const reservation = await getWorkerReservationById(mongoUri, reservationId);

        if (!reservation) {
          return json({ message: 'Reserva não encontrada.' }, origin, { status: 404 });
        }

        return json({ reservation }, origin);
      }

      if (request.method === 'PATCH') {
        const body = await readJson(request);
        const parsed = reservationUpdateSchema.safeParse(body);

        if (!parsed.success) {
          return json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, origin, { status: 400 });
        }

        try {
          const reservation = await updateWorkerReservation(mongoUri, reservationId, parsed.data);

          if (!reservation) {
            return json({ message: 'Reserva não encontrada.' }, origin, { status: 404 });
          }

          return json({ message: 'Reserva atualizada com sucesso.', reservation }, origin);
        } catch (error) {
          return handleKnownError(error, origin);
        }
      }

      if (request.method === 'DELETE') {
        const reservation = await deleteWorkerReservation(mongoUri, reservationId);

        if (!reservation) {
          return json({ message: 'Reserva não encontrada.' }, origin, { status: 404 });
        }

        return json({ message: 'Reserva removida com sucesso.' }, origin);
      }
    }
  }

  return null;
}

function handleKnownError(error: unknown, origin: string) {
  if (error instanceof HttpError) {
    return json(
      {
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      },
      origin,
      { status: error.statusCode }
    );
  }

  if (isWorkerReservationError(error)) {
    return json(
      {
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      },
      origin,
      { status: error.statusCode }
    );
  }

  console.error('❌ Worker API Error:', error);
  return json({ message: 'Erro interno do servidor.' }, origin, { status: 500 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = getAllowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    try {
      if (request.method === 'GET' && url.pathname === '/') {
        return json({ message: "Richard's Restaurant Grill API is running." }, origin);
      }

      if (request.method === 'GET' && url.pathname === '/api/health') {
        return json({ status: 'ok', service: 'richards-restaurant-grill-api' }, origin);
      }

      const reviewResponse = await handleReviews(request, env, origin, url.pathname);
      if (reviewResponse) return reviewResponse;

      const reservationResponse = await handleReservations(request, env, origin, url, url.pathname);
      if (reservationResponse) return reservationResponse;

      return json({ message: 'Endpoint não encontrado.' }, origin, { status: 404 });
    } catch (error) {
      return handleKnownError(error, origin);
    }
  }
};
