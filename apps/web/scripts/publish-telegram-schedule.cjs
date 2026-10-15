const channelUsername = "@akademy_ekb";
const botUsername = "hdaschedulebot";
const miniAppUrl = `https://t.me/${botUsername}?startapp=schedule`;
const messageText = "Расписание Академии\nВыберите мероприятие и нажмите «Записаться».";

async function publishTelegramSchedule(token, request = fetch) {
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
  if (bot.username !== botUsername) throw new Error("Token belongs to a different bot");
  if (!bot.has_main_web_app) throw new Error("Main Mini App is not configured in BotFather");

  const member = await call("getChatMember", { chat_id: channelUsername, user_id: bot.id });
  if (member.status !== "administrator" || !member.can_post_messages || !member.can_edit_messages) {
    throw new Error("Bot needs channel administrator rights to publish and pin the schedule");
  }

  const message = await call("sendMessage", {
    chat_id: channelUsername,
    text: messageText,
    reply_markup: { inline_keyboard: [[{ text: "РАСПИСАНИЕ", url: miniAppUrl }]] },
  });
  await call("pinChatMessage", {
    chat_id: channelUsername,
    message_id: message.message_id,
    disable_notification: true,
  });

  const messageUrl = `https://t.me/akademy_ekb/${message.message_id}`;
  console.log(`Telegram schedule published and pinned: ${messageUrl}`);
  return { messageUrl };
}

module.exports = { publishTelegramSchedule };
if (require.main === module) {
  publishTelegramSchedule(process.env.TELEGRAM_BOT_TOKEN).catch((error) => {
    console.error(
      error.message.replaceAll(process.env.TELEGRAM_BOT_TOKEN || "[no-token]", "[redacted]"),
    );
    process.exitCode = 1;
  });
}
