import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create admin context with cookie
function createAdminContext(): TrpcContext {
  const adminPassword = "test-admin-password";
  const cookieValue = Buffer.from(adminPassword).toString("base64");
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: `admin_session=${cookieValue}`,
      },
    } as any,
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

describe("orders.create", () => {
  it("rejects invalid CPF", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.create({
        customerName: "Test User",
        customerCpf: "111.111.111-11",
        customerEmail: "test@test.com",
        customerPhone: "(71) 99999-9999",
        subtotal: "100.00",
        total: "100.00",
        items: [{ productId: 1, productName: "Test", quantity: 1, price: "100.00" }],
      })
    ).rejects.toThrow("CPF inválido");
  });

  it("rejects invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.create({
        customerName: "Test User",
        customerCpf: "529.982.247-25",
        customerEmail: "invalid-email",
        customerPhone: "(71) 99999-9999",
        subtotal: "100.00",
        total: "100.00",
        items: [{ productId: 1, productName: "Test", quantity: 1, price: "100.00" }],
      })
    ).rejects.toThrow("Email inválido");
  });

  it("rejects invalid phone", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.create({
        customerName: "Test User",
        customerCpf: "529.982.247-25",
        customerEmail: "test@test.com",
        customerPhone: "123",
        subtotal: "100.00",
        total: "100.00",
        items: [{ productId: 1, productName: "Test", quantity: 1, price: "100.00" }],
      })
    ).rejects.toThrow("Telefone inválido");
  });
});

describe("admin.login", () => {
  it("rejects wrong password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Set env for test
    const originalPassword = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "correct-password";

    const result = await caller.admin.login({ password: "wrong-password" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Senha incorreta");

    process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("accepts correct password and sets cookie", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const testPassword = "test-admin-123";
    process.env.ADMIN_PASSWORD = testPassword;

    const result = await caller.admin.login({ password: testPassword });
    expect(result.success).toBe(true);
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      "admin_session",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: "/",
      })
    );

    process.env.ADMIN_PASSWORD = undefined;
  });
});

describe("admin.checkAuth", () => {
  it("returns false for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.checkAuth();
    expect(result.isAdmin).toBe(false);
  });

  it("returns true for admin cookie", async () => {
    // Use a password that produces base64 without '=' padding (multiple of 3 chars)
    const testPassword = "admpwd";
    process.env.ADMIN_PASSWORD = testPassword;

    const cookieValue = Buffer.from(testPassword).toString("base64");
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {
          cookie: `admin_session=${cookieValue}`,
        },
      } as any,
      res: {
        clearCookie: vi.fn(),
        cookie: vi.fn(),
      } as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.checkAuth();
    expect(result.isAdmin).toBe(true);

    delete (process.env as any).ADMIN_PASSWORD;
  });

  it("returns true for admin role user", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "admin-user",
        email: "admin@test.com",
        name: "Admin",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {
        clearCookie: vi.fn(),
        cookie: vi.fn(),
      } as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.checkAuth();
    expect(result.isAdmin).toBe(true);
  });
});

describe("shared validation helpers", () => {
  it("validates CPF correctly", async () => {
    const { validateCPF, validateEmail, validatePhone } = await import("../shared/types");
    
    // Valid CPFs
    expect(validateCPF("529.982.247-25")).toBe(true);
    
    // Invalid CPFs
    expect(validateCPF("111.111.111-11")).toBe(false);
    expect(validateCPF("123")).toBe(false);
    expect(validateCPF("")).toBe(false);
  });

  it("validates email correctly", async () => {
    const { validateEmail } = await import("../shared/types");
    
    expect(validateEmail("test@test.com")).toBe(true);
    expect(validateEmail("user@domain.co")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
  });

  it("validates phone correctly", async () => {
    const { validatePhone } = await import("../shared/types");
    
    expect(validatePhone("(71) 99999-9999")).toBe(true);
    expect(validatePhone("71999999999")).toBe(true);
    expect(validatePhone("7199999999")).toBe(true);
    expect(validatePhone("123")).toBe(false);
  });

  it("formats CPF correctly", async () => {
    const { formatCPF } = await import("../shared/types");
    
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
    expect(formatCPF("529")).toBe("529");
    expect(formatCPF("529982")).toBe("529.982");
  });

  it("formats phone correctly", async () => {
    const { formatPhone } = await import("../shared/types");
    
    expect(formatPhone("71999999999")).toBe("(71) 99999-9999");
    expect(formatPhone("71")).toBe("71");
    expect(formatPhone("71999")).toBe("(71) 999");
  });

  it("formats CEP correctly", async () => {
    const { formatCEP } = await import("../shared/types");
    
    expect(formatCEP("41820000")).toBe("41820-000");
    expect(formatCEP("41820")).toBe("41820");
  });
});
