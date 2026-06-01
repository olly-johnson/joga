import { shouldProvisionOnAuthChange } from "./auth-events";

describe("shouldProvisionOnAuthChange", () => {
  it("provisions on sign-in with a session", () => {
    expect(shouldProvisionOnAuthChange("SIGNED_IN", true)).toBe(true);
  });

  it("provisions on the restored initial session", () => {
    expect(shouldProvisionOnAuthChange("INITIAL_SESSION", true)).toBe(true);
  });

  it("does NOT re-provision on a token refresh", () => {
    expect(shouldProvisionOnAuthChange("TOKEN_REFRESHED", true)).toBe(false);
  });

  it("does NOT provision when there is no session", () => {
    expect(shouldProvisionOnAuthChange("SIGNED_IN", false)).toBe(false);
    expect(shouldProvisionOnAuthChange("INITIAL_SESSION", false)).toBe(false);
  });

  it("does NOT provision on sign-out", () => {
    expect(shouldProvisionOnAuthChange("SIGNED_OUT", false)).toBe(false);
  });
});
