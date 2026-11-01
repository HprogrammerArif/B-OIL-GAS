import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email/password pair", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    password: "Str0ng!Pass",
    confirmPassword: "Str0ng!Pass",
    acceptTerms: true,
  };

  it("accepts a fully valid registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a password missing complexity requirements", () => {
    const result = registerSchema.safeParse({ ...base, password: "weak", confirmPassword: "weak" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "Different1!" });
    expect(result.success).toBe(false);
  });

  it("rejects when terms are not accepted", () => {
    const result = registerSchema.safeParse({ ...base, acceptTerms: false });
    expect(result.success).toBe(false);
  });
});
