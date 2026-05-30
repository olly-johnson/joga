import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { createPublicKey, type JsonWebKey as CryptoJsonWebKey } from "crypto";
import { PrismaService } from "../prisma/prisma.service.js";

export interface JwtPayload {
  sub: string;
  email?: string;
  user_metadata?: { first_name?: string; last_name?: string };
}

/** Minimal surface the key provider depends on — keeps it unit-testable. */
export interface SigningKeyResolver {
  getSigningKey(kid: string | undefined): Promise<{ getPublicKey(): string }>;
}

type SecretCallback = (err: Error | null, secret?: string) => void;

/**
 * Supabase signs user access tokens with an asymmetric key (ES256) by default,
 * while the legacy anon/service tokens — and our e2e test tokens — use the
 * symmetric HS256 shared secret. This provider routes each token to the right
 * key based on its header `alg`: HS256 → the shared secret, anything else →
 * the matching public key from the project's JWKS endpoint (by `kid`).
 */
export function createSecretOrKeyProvider(
  jwks: SigningKeyResolver,
  hmacSecret: string,
) {
  return (_request: unknown, rawJwtToken: string, done: SecretCallback): void => {
    let header: { alg?: string; kid?: string };
    try {
      const segment = rawJwtToken.split(".")[0];
      header = JSON.parse(Buffer.from(segment, "base64").toString("utf8")) as {
        alg?: string;
        kid?: string;
      };
    } catch {
      done(new Error("Malformed JWT header"));
      return;
    }

    if (header.alg === "HS256") {
      done(null, hmacSecret);
      return;
    }

    jwks
      .getSigningKey(header.kid)
      .then((key) => done(null, key.getPublicKey()))
      .catch((err: unknown) => done(err as Error));
  };
}

interface Jwk {
  kid?: string;
  [key: string]: unknown;
}

/**
 * Fetches a Supabase project's JWKS and converts the matching JWK to a PEM
 * public key using Node's built-in crypto (no external deps). Keys are cached
 * in-memory with a TTL; an unknown `kid` forces a one-off refresh to tolerate
 * signing-key rotation.
 */
export class SupabaseJwks implements SigningKeyResolver {
  private cache: { keys: Jwk[]; fetchedAt: number } | null = null;

  constructor(
    private readonly jwksUri: string,
    private readonly ttlMs = 10 * 60 * 1000,
  ) {}

  private async fetchKeys(): Promise<Jwk[]> {
    const res = await fetch(this.jwksUri);
    if (!res.ok) {
      throw new Error(`JWKS fetch failed: ${res.status}`);
    }
    const body = (await res.json()) as { keys?: Jwk[] };
    return Array.isArray(body.keys) ? body.keys : [];
  }

  private async getKeys(forceRefresh = false): Promise<Jwk[]> {
    const fresh =
      this.cache && Date.now() - this.cache.fetchedAt < this.ttlMs;
    if (!forceRefresh && fresh) {
      return this.cache!.keys;
    }
    const keys = await this.fetchKeys();
    this.cache = { keys, fetchedAt: Date.now() };
    return keys;
  }

  async getSigningKey(kid: string | undefined) {
    let keys = await this.getKeys();
    let jwk = keys.find((k) => k.kid === kid);
    if (!jwk) {
      keys = await this.getKeys(true);
      jwk = keys.find((k) => k.kid === kid);
    }
    if (!jwk) {
      throw new Error(`No JWKS signing key found for kid "${kid ?? ""}"`);
    }

    const pem = createPublicKey({
      key: jwk as unknown as CryptoJsonWebKey,
      format: "jwk",
    })
      .export({ type: "spki", format: "pem" })
      .toString();
    return { getPublicKey: () => pem };
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const jwks = new SupabaseJwks(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""}/auth/v1/.well-known/jwks.json`,
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: createSecretOrKeyProvider(
        jwks,
        process.env.SUPABASE_JWT_SECRET ?? "",
      ),
      ignoreExpiration: false,
      algorithms: ["ES256", "HS256"],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token: missing sub");
    }

    const user = await this.prisma.user.findUnique({
      where: { clerkId: payload.sub },
    });

    return { supabaseId: payload.sub, userId: user?.id ?? null, email: payload.email };
  }
}
