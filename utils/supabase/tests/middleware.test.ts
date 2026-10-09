import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { updateSession } from "../middleware";

jest.mock("@supabase/ssr", () => ({ createServerClient: jest.fn() }));
const mockCreate = jest.mocked(createServerClient);

it("forwards refreshed cookie chunks and preserves auth cache headers across writes", async () => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  const request = new NextRequest("http://localhost/dashboard");
  const getUser = jest.fn(async () => {
    const options = mockCreate.mock.calls[0][2] as { cookies: CookieMethodsServer };
    await options.cookies.setAll!([
      { name: "sb-session.0", value: "chunk-one", options: { httpOnly: true } },
      { name: "sb-session.1", value: "chunk-two", options: { httpOnly: true } },
    ], { "Cache-Control": "private, no-store", Pragma: "no-cache" });
    await options.cookies.setAll!([
      { name: "sb-session.1", value: "updated-chunk", options: { httpOnly: true } },
    ], {});
    return { data: { user: null }, error: null };
  });
  mockCreate.mockReturnValue({ auth: { getUser } } as unknown as ReturnType<typeof createServerClient>);
  try {
    const response = await updateSession(request);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(request.cookies.get("sb-session.0")?.value).toBe("chunk-one");
    expect(request.cookies.get("sb-session.1")?.value).toBe("updated-chunk");
    expect(response.cookies.get("sb-session.0")?.value).toBe("chunk-one");
    expect(response.cookies.get("sb-session.1")?.value).toBe("updated-chunk");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("sb-session.1=updated-chunk");
  } finally {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey;
  }
});
