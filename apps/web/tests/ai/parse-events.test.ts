import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/parse-events/route";

const mock = vi.hoisted(() => ({ user: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/auth/helpers", () => ({ getCurrentUser: mock.user }));

const request = (text = "15 октября семинар 10–12") =>
  new Request("http://localhost/api/ai/parse-events", {
    method: "POST",
    body: JSON.stringify({ text, speakers: [], branches: [] }),
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("OPENROUTER_API_KEY", "test-only-key");
  vi.stubGlobal("fetch", mock.fetch);
  mock.user.mockResolvedValue({ id: "owner" });
});

describe("Пакетное распознавание: бюджет ответа", () => {
  it("ограничивает ответ 8192 токенами, сохраняя разбор tool_call", async () => {
    mock.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      name: "create_events",
                      arguments: JSON.stringify({
                        events: [
                          {
                            title: "Семинар",
                            date: "2026-10-15",
                            start_time: "10:00",
                            end_time: "12:00",
                          },
                        ],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        }),
      ),
    );
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).events[0].title).toBe("Семинар");
    expect(JSON.parse(mock.fetch.mock.calls[0]![1].body)).toMatchObject({
      model: "deepseek/deepseek-chat-v3-0324",
      max_tokens: 8192,
    });
  });

  it("объясняет HTTP402 без сырых metadata провайдера", async () => {
    mock.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 402,
            message: "requires more credits",
            metadata: { user_id: "private-provider-id" },
          },
        }),
        { status: 402 },
      ),
    );
    const response = await POST(request());
    const data = await response.json();
    expect(data.error).toMatch(/сократите список/i);
    expect(data.error).toMatch(/баланс OpenRouter/i);
    expect(data.error).not.toContain("private-provider-id");
    expect(mock.fetch).toHaveBeenCalledOnce();
  });

  it("не показывает сырой ответ при других ошибках", async () => {
    mock.fetch.mockResolvedValue(new Response("internal-provider-info", { status: 500 }));
    const data = await (await POST(request())).json();
    expect(data.error).toMatch(/попробуйте позже/i);
    expect(data.error).not.toContain("internal-provider-info");
  });

  it("не отправляет запрос без авторизации или с пустым текстом", async () => {
    mock.user.mockResolvedValueOnce(null);
    expect((await POST(request())).status).toBe(401);
    expect((await POST(request(""))).status).toBe(400);
    expect(mock.fetch).not.toHaveBeenCalled();
  });
});
