import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Intent } from "./replies";

/**
 * Quando as regras de `parseIntent` não entendem a resposta da cliente, pedimos ao modelo uma
 * SUGESTÃO de intenção. Ela nunca altera agendamento: só enriquece o aviso para a profissional,
 * que decide. Qualquer falha (sem chave, rede, resposta estranha) vira `null`.
 */
const MODEL = "claude-haiku-5-5";
const TIMEOUT_MS = 8_000;
const MAX_INPUT_CHARS = 500;

const SYSTEM = `Você ajuda um estúdio de beleza a entender a resposta de uma cliente a um lembrete de horário.
Responda com UMA palavra, sem pontuação:
- confirm: ela claramente confirma que vai comparecer
- cancel: ela claramente diz que não vai / quer cancelar
- reschedule: ela quer mudar o horário
- unknown: qualquer outra coisa, mensagem ambígua, mista ou que não trata do horário
Na dúvida, responda unknown.`;

const VALID: ReadonlySet<string> = new Set<Intent>(["confirm", "cancel", "reschedule"]);

let client: Anthropic | null = null;

/** Texto da cliente é dado, não instrução: vai só como mensagem do usuário, truncado. */
export async function suggestIntent(text: string): Promise<Intent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    client ??= new Anthropic({ apiKey, maxRetries: 1, timeout: TIMEOUT_MS });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 5,
      system: SYSTEM,
      messages: [{ role: "user", content: text.slice(0, MAX_INPUT_CHARS) }],
    });
    const block = res.content[0];
    const word = block?.type === "text" ? block.text.trim().toLowerCase() : "";
    return VALID.has(word) ? (word as Intent) : null;
  } catch (e) {
    console.error(JSON.stringify({ level: "warn", msg: "suggest_intent_failed", err: String(e) }));
    return null;
  }
}
