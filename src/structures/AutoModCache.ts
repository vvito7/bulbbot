let cache: any = {};

/*export async function set(
	client: BulbBotClient,
	message: Message,
	guild: Snowflake,
	category: "mentions" | "messages",
	user: Snowflake,
	value: number,
	timeout: number = 10000,
): Promise<void> {
	if (cache[guild] === undefined) cache[guild] = { mentions: {}, messages: {} };

	if (!cache[guild][category][user]) cache[guild][category][user] = { count: value, time: Date.now() };
	else cache[guild][category][user]["count"] = cache[guild][category][user]["count"] + value;

	const dbGuild = await AutoModUtils.getGuildAutoMod(guild);

	const messageLimit = await AutoModUtils.getMessageLimit(message.guild?.id);
	const mentionsLimit = await AutoModUtils.getMentionsLimit(message.guild?.id);

	if (cache[guild]["messages"][user] && cache[guild]["messages"][user]["count"] >= messageLimit && messageLimit !== 0) {
		if (!(message.channel instanceof DMChannel)) {
			await AutoModUtils.resolveAction(
				client,
				message,
				dbGuild.automod.punishmentMessages,
				`Violated \`MAX MESSAGES\` check in #${message.channel.name} (${cache[guild]["messages"][user]["count"]}/10s)`,
			);
		}
		await SendAutoModLog(
			client,
			guild,
			`${Emotes.actions.WARN} **${message.author.tag}** \`${message.author.id}\` has violated the \`MAX MESSAGES\` check in <#${
				message.channel.id
			}>. Messages (${cache[guild]["messages"][user]["count"]}/${(Date.now() - cache[guild]["messages"][user]["time"]) / 1000}s)`,
		);
		delete cache[guild]["messages"][user];
	}

	if (cache[guild]["mentions"][user] && cache[guild]["mentions"][user]["count"] >= mentionsLimit && mentionsLimit !== 0) {
		if (!(message.channel instanceof DMChannel)) {
			await AutoModUtils.resolveAction(
				client,
				message,
				dbGuild.automod.punishmentMentions,
				`Violated \`MAX MENTIONS\` check in #${message.channel.name} (${cache[guild]["mentions"][user]["count"]}/15s)`,
			);
		}
		await SendAutoModLog(
			client,
			guild,
			`${Emotes.actions.WARN} **${message.author.tag}** \`${message.author.id}\` has violated the \`MAX MENTIONS\` check in <#${
				message.channel.id
			}>. Mentions (${cache[guild]["mentions"][user]["count"]}/${(Date.now() - cache[guild]["mentions"][user]["time"]) / 1000}s)`,
		);
		delete cache[guild]["mentions"][user];
	}

	setTimeout(function () {
		if (cache[guild] === undefined || cache[guild][category] === undefined || cache[guild][category][user] === undefined) return;

		cache[guild][category][user]["count"] = cache[guild][category][user]["count"] - value;
		cache[guild][category][user]["time"] = Date.now();
		if (cache[guild][category][user]["count"] <= 0) delete cache[guild][category][user];
		if (Object.keys(cache[guild]["messages"]).length === 0 && Object.keys(cache[guild]["mentions"]).length === 0) delete cache[guild];
	}, timeout);
}*/

export function getAll(): Object {
	return cache;
}
