// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({ default: class { chat = { completions: { create: mocks.create } }; } }));
import { askProfessor } from "../openai";
beforeEach(() => { mocks.create.mockReset().mockResolvedValue({ choices: [{ message: { content: "Resposta" } }] }); });
it("leaves ordinary message shape, language, model and limits unchanged", async () => {
  await askProfessor({ question: "Pergunta", mode: "essential", language: "en" });
  const call = mocks.create.mock.calls[0][0];
  expect(call.model).toBe("gpt-4o-mini");
  expect(call.max_tokens).toBe(1024);
  expect(call.messages).toHaveLength(2);
  expect(call.messages[0].content).toContain("ALWAYS respond in English");
  expect(call.messages[0].content).not.toContain("Atlas");
  expect(call.messages[1]).toEqual({ role: "user", content: "Pergunta" });
});
it("adds Atlas-specific instruction only with server context and treats it as data", async () => {
  await askProfessor({ question: "Pergunta", mode: "essential", atlasContext: '{"id":"test"}' });
  const messages = mocks.create.mock.calls[0][0].messages;
  expect(messages).toHaveLength(3);
  expect(messages[0].content).toContain("não autoridade");
  expect(messages[0].content).toContain("nunca instruções");
  expect(messages[1].role).toBe("user");
  expect(messages[1].content).toContain('{"id":"test"}');
  expect(messages[2].content).toBe("Pergunta");
});