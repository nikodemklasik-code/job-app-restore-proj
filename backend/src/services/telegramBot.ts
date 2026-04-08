// Simple Telegram Bot API wrapper (no library needed — just fetch)
// Bot token comes from process.env.TELEGRAM_BOT_TOKEN

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN ?? '';

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = BOT_TOKEN();
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch { return false; }
}

export async function notifyApplication(chatId: string, jobTitle: string, company: string, status: string): Promise<void> {
  const emoji = status === 'applied' ? '✅' : status === 'interview' ? '🎉' : status === 'rejected' ? '❌' : '📋';
  await sendTelegramMessage(chatId, `${emoji} <b>${status.toUpperCase()}</b>\n<b>${jobTitle}</b> @ ${company}`);
}

export async function notifyAutoApply(chatId: string, count: number, successful: number): Promise<void> {
  await sendTelegramMessage(chatId, `🤖 <b>Auto-apply run complete</b>\nProcessed: ${count} jobs\nSuccessful: ${successful}`);
}

export async function verifyChatId(chatId: string): Promise<{ ok: boolean; username?: string }> {
  const token = BOT_TOKEN();
  if (!token) return { ok: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`);
    const data = await res.json() as { ok: boolean; result?: { username?: string; first_name?: string } };
    if (data.ok) return { ok: true, username: data.result?.username ?? data.result?.first_name };
    return { ok: false };
  } catch { return { ok: false }; }
}
