const scheduleUrl = "https://academy-ecosystem-gfeawps9m-igorsibola.vercel.app/";

async function configureTelegram(token, request = fetch) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing on Vercel");
  const call = async (method, body = {}) => {
    const response = await request(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(`${method}: ${data.description || "Telegram rejected request"}`);
    return data.result;
  };
  const bot = await call("getMe");
  if (bot.username !== "hdaschedulebot") throw new Error("Token belongs to a different bot");
  console.log(`Telegram bot verified: @${bot.username}`);
  const menu = { type: "web_app", text: "РАСПИСАНИЕ", web_app: { url: scheduleUrl } };
  await call("setChatMenuButton", { menu_button: menu });
  const saved = await call("getChatMenuButton");
  if (saved.type !== "web_app" || saved.text !== menu.text || saved.web_app?.url !== scheduleUrl) {
    throw new Error("Menu button verification failed");
  }
  console.log("Telegram menu verified: РАСПИСАНИЕ");
  try {
    const member = await call("getChatMember", { chat_id: "@akademy_ekb", user_id: bot.id });
    console.log(
      `Channel status: ${member.status}; posting: ${!!member.can_post_messages}; editing: ${!!member.can_edit_messages}`,
    );
  } catch (error) {
    console.log(`Channel access check: ${error.message}`);
  }
}

module.exports = { configureTelegram };
if (require.main === module) {
  configureTelegram(process.env.TELEGRAM_BOT_TOKEN).catch((error) => {
    console.error(
      error.message.replaceAll(process.env.TELEGRAM_BOT_TOKEN || "[no-token]", "[redacted]"),
    );
    process.exitCode = 1;
  });
}
