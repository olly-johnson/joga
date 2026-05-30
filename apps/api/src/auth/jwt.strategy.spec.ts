import { generateKeyPairSync } from "crypto";
import jwt from "jsonwebtoken";
import { createSecretOrKeyProvider, SupabaseJwks } from "./jwt.strategy.js";

describe("createSecretOrKeyProvider", () => {
  it("returns the static HMAC secret for legacy HS256 tokens", (done) => {
    const jwks = { getSigningKey: jest.fn() };
    const provider = createSecretOrKeyProvider(jwks, "the-shared-secret");
    const token = jwt.sign({ sub: "user-1" }, "the-shared-secret", {
      algorithm: "HS256",
    });

    provider(null, token, (err, secret) => {
      try {
        expect(err).toBeNull();
        expect(secret).toBe("the-shared-secret");
        expect(jwks.getSigningKey).not.toHaveBeenCalled();
        done();
      } catch (e) {
        done(e as Error);
      }
    });
  });

  it("resolves the JWKS public key for asymmetric ES256 tokens", (done) => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    const token = jwt.sign(
      { sub: "user-2" },
      privateKey.export({ type: "pkcs8", format: "pem" }),
      { algorithm: "ES256", keyid: "kid-abc" },
    );
    const jwks = {
      getSigningKey: jest.fn().mockResolvedValue({ getPublicKey: () => publicPem }),
    };
    const provider = createSecretOrKeyProvider(jwks, "unused-secret");

    provider(null, token, (err, secret) => {
      try {
        expect(err).toBeNull();
        expect(jwks.getSigningKey).toHaveBeenCalledWith("kid-abc");
        expect(secret).toBe(publicPem);
        // The resolved key must actually verify the token.
        expect(() =>
          jwt.verify(token, secret as string, { algorithms: ["ES256"] }),
        ).not.toThrow();
        done();
      } catch (e) {
        done(e as Error);
      }
    });
  });

  it("surfaces an error for a malformed token header", (done) => {
    const jwks = { getSigningKey: jest.fn() };
    const provider = createSecretOrKeyProvider(jwks, "secret");

    provider(null, "not-a-jwt", (err) => {
      try {
        expect(err).toBeInstanceOf(Error);
        done();
      } catch (e) {
        done(e as Error);
      }
    });
  });

  it("propagates JWKS lookup failures", (done) => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const token = jwt.sign(
      { sub: "user-3" },
      privateKey.export({ type: "pkcs8", format: "pem" }),
      { algorithm: "ES256", keyid: "missing-kid" },
    );
    const jwks = {
      getSigningKey: jest.fn().mockRejectedValue(new Error("kid not found")),
    };
    const provider = createSecretOrKeyProvider(jwks, "secret");

    provider(null, token, (err, secret) => {
      try {
        expect(err).toBeInstanceOf(Error);
        expect(secret).toBeUndefined();
        done();
      } catch (e) {
        done(e as Error);
      }
    });
  });
});

describe("SupabaseJwks", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  function ecKeyAsJwk(kid: string) {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    const jwk = { ...publicKey.export({ format: "jwk" }), kid, alg: "ES256", use: "sig" };
    const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
    return { jwk, privatePem };
  }

  it("fetches the JWKS and converts the matching EC JWK into a verifying PEM", async () => {
    const { jwk, privatePem } = ecKeyAsJwk("kid-1");
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ keys: [jwk] }) }) as never;

    const jwks = new SupabaseJwks("https://example.test/jwks");
    const key = await jwks.getSigningKey("kid-1");
    const token = jwt.sign({ sub: "u" }, privatePem, {
      algorithm: "ES256",
      keyid: "kid-1",
    });

    expect(() =>
      jwt.verify(token, key.getPublicKey(), { algorithms: ["ES256"] }),
    ).not.toThrow();
  });

  it("serves repeat lookups from cache without re-fetching", async () => {
    const { jwk } = ecKeyAsJwk("kid-2");
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ keys: [jwk] }) });
    global.fetch = fetchMock as never;

    const jwks = new SupabaseJwks("https://example.test/jwks");
    await jwks.getSigningKey("kid-2");
    await jwks.getSigningKey("kid-2");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when no key matches the requested kid", async () => {
    const { jwk } = ecKeyAsJwk("kid-present");
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ keys: [jwk] }) }) as never;

    const jwks = new SupabaseJwks("https://example.test/jwks");
    await expect(jwks.getSigningKey("kid-absent")).rejects.toThrow(/kid/);
  });
});
