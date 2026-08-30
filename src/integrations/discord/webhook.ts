import "server-only";

import { z } from "zod";

const discordWebhookSchema = z
  .url()
  .refine(
    (value) => {
      const url = new URL(value);
      return (
        (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
        url.pathname.startsWith("/api/webhooks/")
      );
    },
    "DISCORD_WEBHOOK_URL must be a Discord incoming webhook URL.",
  );

export function isDiscordWebhookConfigured() {
  return discordWebhookSchema.safeParse(process.env.DISCORD_WEBHOOK_URL).success;
}

export async function sendDiscordWebhook(input: {
  title: string;
  description: string;
  color?: number;
}) {
  const webhookUrl = discordWebhookSchema.parse(process.env.DISCORD_WEBHOOK_URL);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: input.title,
          description: input.description,
          color: input.color ?? 0xf97316,
          timestamp: new Date().toISOString(),
        },
      ],
      allowed_mentions: { parse: [] },
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}.`);
  }
}

