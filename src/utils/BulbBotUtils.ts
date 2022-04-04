import { ContextMenuInteraction, GuildChannel, GuildMember, MessageEmbed, Snowflake, TextChannel, ThreadAutoArchiveDuration, ThreadChannel, User } from "discord.js";
import * as Emotes from "../emotes.json";
import moment, { Duration, Moment } from "moment";
import CommandContext from "../structures/CommandContext";
import BulbBotClient from "../structures/BulbBotClient";
import { UserHandle } from "./types/UserHandle";
import i18next, { TOptions } from "i18next";
import { translatorEmojis, translatorConfig, error } from "../Config";
import TranslateString from "./types/TranslateString";
import DatabaseManager from "./managers/DatabaseManager";
import { GuildFeaturesDescriptions } from "./types/GuildFeaturesDescriptions";
import { isBaseGuildTextChannel } from "./typechecks";
import { GuildFeature } from "discord-api-types";

const databaseManager: DatabaseManager = new DatabaseManager();

export default class {
	private readonly client: BulbBotClient;

	constructor(client: BulbBotClient) {
		this.client = client;
	}

	public async translate(string: TranslateString, guildID: Snowflake = "742094927403679816", options: TOptions): Promise<string> {
		const language = (await databaseManager.getConfig(guildID))["language"];
		if (language !== i18next.language) await i18next.changeLanguage((await databaseManager.getConfig(guildID))["language"]);

		return await i18next.t(string, { ...options, ...translatorEmojis, ...translatorConfig });
	}

	// acts as a placeholder for an actual call to translator, to indicate a string should get a translation
	public async needsTranslation(string: string, ..._: any) {
		return string;
	}

	public applicationFlags(flag: number) {
		const flags: string[] = [];
		const GATEWAY_PRESENCE: number = 1 << 12;
		const GATEWAY_PRESENCE_LIMITED: number = 1 << 13;
		const GATEWAY_GUILD_MEMBERS: number = 1 << 14;
		const GATEWAY_GUILD_MEMBERS_LIMITED: number = 1 << 15;
		const VERIFICATION_PENDING_GUILD_LIMIT: number = 1 << 16;
		const EMBEDDED: number = 1 << 17;
		const GATEWAY_MESSAGE_CONTENT: number = 1 << 18;
		const GATEWAY_MESSAGE_CONTENT_LIMITED: number = 1 << 19;

		if ((flag & GATEWAY_PRESENCE) == GATEWAY_PRESENCE) flags.push("GATEWAY_PRESENCE");
		if ((flag & GATEWAY_PRESENCE_LIMITED) == GATEWAY_PRESENCE_LIMITED) flags.push("GATEWAY_PRESENCE_LIMITED");
		if ((flag & GATEWAY_GUILD_MEMBERS) == GATEWAY_GUILD_MEMBERS) flags.push("GATEWAY_GUILD_MEMBERS");
		if ((flag & GATEWAY_GUILD_MEMBERS_LIMITED) == GATEWAY_GUILD_MEMBERS_LIMITED) flags.push("GATEWAY_GUILD_MEMBERS_LIMITED");
		if ((flag & VERIFICATION_PENDING_GUILD_LIMIT) == VERIFICATION_PENDING_GUILD_LIMIT) flags.push("VERIFICATION_PENDING_GUILD_LIMIT");
		if ((flag & EMBEDDED) == EMBEDDED) flags.push("EMBEDDED");
		if ((flag & GATEWAY_MESSAGE_CONTENT) == GATEWAY_MESSAGE_CONTENT) flags.push("GATEWAY_MESSAGE_CONTENT");
		if ((flag & GATEWAY_MESSAGE_CONTENT_LIMITED) == GATEWAY_MESSAGE_CONTENT_LIMITED) flags.push("GATEWAY_MESSAGE_CONTENT_LIMITED");

		return flags;
	}

	public badges(bitfield: number) {
		const badges: string[] = [];

		const staff: number = 1 << 0;
		const partner: number = 1 << 1;
		const hypesquad_events: number = 1 << 2;
		const bughunter_green: number = 1 << 3;
		const hypesquad_bravery: number = 1 << 6;
		const hypesquad_brilliance: number = 1 << 7;
		const hypesquad_balance: number = 1 << 8;
		const early_support: number = 1 << 9;
		const bughunter_gold: number = 1 << 14;
		const verified_bot: number = 1 << 16;
		const bot_developer: number = 1 << 17;
		const certified_mod: number = 1 << 18;
		const spammer: number = 1 << 20;

		if ((bitfield & staff) === staff) badges.push(Emotes.flags.DISCORD_EMPLOYEE);
		if ((bitfield & partner) === partner) badges.push(Emotes.flags.PARTNERED_SERVER_OWNER);
		if ((bitfield & hypesquad_events) === hypesquad_events) badges.push(Emotes.flags.HYPESQUAD_EVENTS);
		if ((bitfield & bughunter_green) === bughunter_green) badges.push(Emotes.flags.BUGHUNTER_LEVEL_1);
		if ((bitfield & hypesquad_bravery) === hypesquad_bravery) badges.push(Emotes.flags.HOUSE_BRAVERY);
		if ((bitfield & hypesquad_brilliance) === hypesquad_brilliance) badges.push(Emotes.flags.HOUSE_BRILLIANCE);
		if ((bitfield & hypesquad_balance) === hypesquad_balance) badges.push(Emotes.flags.HOUSE_BALANCE);
		if ((bitfield & early_support) === early_support) badges.push(Emotes.flags.EARLY_SUPPORTER);
		if ((bitfield & bughunter_gold) === bughunter_gold) badges.push(Emotes.flags.BUGHUNTER_LEVEL_2);
		if ((bitfield & verified_bot) === verified_bot) badges.push(Emotes.flags.VERIFIED_BOT);
		if ((bitfield & bot_developer) === bot_developer) badges.push(Emotes.flags.EARLY_VERIFIED_DEVELOPER);
		if ((bitfield & certified_mod) === certified_mod) badges.push(Emotes.flags.CERTIFIED_MODERATOR);
		if ((bitfield & spammer) === spammer) badges.push(Emotes.flags.SPAMMER);

		return badges.map((i) => `${i}`).join(" ");
	}

	public guildFeatures(guildFeatures: string[]) {
		const features: string[] = [];

		guildFeatures.forEach((feature) => {
			features.push(`${Emotes.features[feature]} [\`${feature}\`](https://bulbbot.rocks '${GuildFeaturesDescriptions[feature]}')`);
		});

		features.sort();

		return features.map((i) => `${i}`).join("\n");
	}

	public resolveThreadArchiveDuration(duration: Maybe<ThreadAutoArchiveDuration>, channel: Maybe<ThreadChannel>): Exclude<ThreadAutoArchiveDuration, "MAX"> {
		if (!duration) {
			// Duration is unavailable for whatever reason, try to fallback to default
			if (isBaseGuildTextChannel(channel)) return this.resolveThreadArchiveDuration(channel.defaultAutoArchiveDuration, channel);
			// Else fall back to minimum 60 minutes
			return 60; // 60 * 1 hour * 1 day
		}

		if (duration === "MAX") {
			if (!channel?.guild.features) return 1440; // 60 * 24 hours * 1 day
			const features = channel.guild.features.filter((feature) => feature.endsWith("DAY_THREAD_ARCHIVE")) as Include<GuildFeature, `${string}DAY_THREAD_ARCHIVE`>[];
			if (features.find((feature) => feature.startsWith("THREE"))) return 4320; // 60 * 24 hours * 3 days
			if (features.find((feature) => feature.startsWith("SEVEN"))) return 10080; // 60 * 24 hours * 7 days
			return 1440; // 60 * 24 hours * 1 day
		}

		// Duration is already a number
		return duration;
	}

	public getUptime(timestamp: number | null) {
		const time: Duration = moment.duration(timestamp, "milliseconds");
		const days: number = Math.floor(time.asDays());
		const hours: number = Math.floor(time.asHours() - days * 24);
		const mins: number = Math.floor(time.asMinutes() - days * 24 * 60 - hours * 60);
		const secs: number = Math.floor(time.asSeconds() - days * 24 * 60 * 60 - hours * 60 * 60 - mins * 60);

		let uptime = "";
		if (days > 0) uptime += `${days} day(s), `;
		if (hours > 0) uptime += `${hours} hour(s), `;
		if (mins > 0) uptime += `${mins} minute(s), `;
		if (secs > 0) uptime += `${secs} second(s)`;

		return uptime;
	}

	public async sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	public formatDays(start: Date) {
		const end: string = moment.utc().format("YYYY-MM-DD");
		const date: Moment = moment(moment.utc(start).format("YYYY-MM-DD"));
		const days: number = moment.duration(date.diff(end)).asDays();

		return `${moment.utc(start).format("MMMM, Do YYYY @ hh:mm:ss a")} \`\`(${Math.floor(days).toString().replace("-", "")} day(s) ago)\`\``;
	}

	public userObject(isGuildMember: boolean, userObject: User | GuildMember) {
		let user;

		if (isGuildMember && userObject instanceof GuildMember) {
			user = {
				tag: userObject.user.tag,
				id: userObject.user.id,
				flags: userObject.user.flags,
				username: userObject.user.username,
				discriminator: userObject.user.discriminator,
				avatar: userObject.user.avatar,
				avatarUrl: userObject.user.avatarURL({ dynamic: true, size: 4096 }),
				bot: userObject.user.bot,

				roles: userObject.roles,
				nickname: userObject.nickname,
				premiumSinceTimestamp: userObject.premiumSinceTimestamp,
				joinedTimestamp: userObject.joinedTimestamp,
				createdAt: userObject.user.createdAt,
				createdTimestamp: userObject.user.createdTimestamp,
			};
		} else if (userObject instanceof User) {
			user = {
				tag: userObject.tag,
				id: userObject.id,
				flags: userObject.flags,
				username: userObject.username,
				discriminator: userObject.discriminator,
				avatar: userObject.avatar,
				avatarUrl: userObject.avatarURL({ dynamic: true, size: 4096 }),
				bot: userObject.bot,
				createdAt: userObject.createdAt,
				createdTimestamp: userObject.createdTimestamp,
				nickname: null,
			};
		}
		if (user.avatarUrl === null) user.avatarUrl = `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;

		return user;
	}

	public prettify(action: string): string {
		return (
			{
				Ban: Emotes.actions.BAN,
				"Manual Ban": Emotes.actions.BAN,
				"Force-ban": Emotes.actions.BAN,
				Kick: Emotes.actions.KICK,
				"Manual Kick": Emotes.actions.KICK,
				Mute: Emotes.actions.MUTE,
				Warn: Emotes.actions.WARN,
				Unmute: Emotes.actions.UNBAN,
				Unban: Emotes.actions.UNBAN,
				true: Emotes.status.ONLINE,
				false: Emotes.other.INF1,
				Nickname: Emotes.other.EDIT,
			}[action] + ` ${action}`
		);
	}

	public checkUser(context: CommandContext, user: GuildMember): UserHandle {
		if (
			context.author.id === context.guild?.ownerId &&
			context.guild?.me &&
			context.guild?.me.roles.highest.id !== user.roles.highest.id &&
			user.roles.highest.rawPosition < context.guild?.me.roles.highest.rawPosition
		)
			return UserHandle.SUCCESS;

		if (user.id === context.author.id) return UserHandle.CANNOT_ACTION_SELF;

		if (context.guild?.ownerId === user.id) return UserHandle.CANNOT_ACTION_OWNER;

		if (context.member?.roles.highest.id === user.roles.highest.id) return UserHandle.CANNOT_ACTION_ROLE_EQUAL;

		if (user.id === this.client.user?.id) return UserHandle.CANNOT_ACTION_BOT_SELF;

		if (context.member?.roles && user.roles.highest.rawPosition >= context.member?.roles.highest.rawPosition) return UserHandle.CANNOT_ACTION_ROLE_HIGHER;

		if (context.guild?.me && context.guild?.me.roles.highest.id === user.roles.highest.id) return UserHandle.CANNOT_ACTION_USER_ROLE_EQUAL_BOT;

		if (context.guild?.me && user.roles.highest.rawPosition >= context.guild?.me.roles.highest.rawPosition) return UserHandle.CANNOT_ACTION_USER_ROLE_HIGHER_BOT;

		return UserHandle.SUCCESS;
	}

	public async resolveUserHandle(context: CommandContext, handle: UserHandle, user: User): Promise<boolean> {
		if (handle == 0) return false;

		// here are two exclusive cases, that use the same message as the other ones
		if (handle == 5) await context.channel.send(await this.translate("global_cannot_action_role_equal", context.guild?.id, { target: user }));
		if (handle == 7) await context.channel.send(await this.translate("global_cannot_action_role_equal_bot", context.guild?.id, { target: user }));

		// @ts-expect-error
		await context.channel.send(await this.translate(`global_${UserHandle[handle].toLocaleLowerCase()}`, context.guild?.id, { target: user }));
		return true;
	}

	/** @deprecated */
	async checkUserFromInteraction(interaction: ContextMenuInteraction, user: GuildMember): Promise<UserHandle> {
		const author = await interaction.guild?.members.fetch(interaction.user.id);

		if (user.id === interaction.user.id) return UserHandle.CANNOT_ACTION_SELF;

		if (interaction.guild?.ownerId === user.id) return UserHandle.CANNOT_ACTION_OWNER;

		if (
			interaction.user.id === interaction.guild?.ownerId &&
			interaction.guild?.me &&
			interaction.guild?.me.roles.highest.id !== user.roles.highest.id &&
			user.roles.highest.rawPosition < interaction.guild?.me.roles.highest.rawPosition
		)
			return UserHandle.SUCCESS;

		if (author?.roles.highest.id === user.roles.highest.id) return UserHandle.CANNOT_ACTION_ROLE_EQUAL;

		if (user.id === this.client.user?.id) return UserHandle.CANNOT_ACTION_BOT_SELF;

		if (author?.roles && user.roles.highest.rawPosition >= author?.roles.highest.rawPosition) return UserHandle.CANNOT_ACTION_ROLE_HIGHER;

		if (interaction.guild?.me && interaction.guild?.me.roles.highest.id === user.roles.highest.id) return UserHandle.CANNOT_ACTION_USER_ROLE_EQUAL_BOT;

		if (interaction.guild?.me && user.roles.highest.rawPosition >= interaction.guild?.me?.roles.highest.rawPosition) return UserHandle.CANNOT_ACTION_USER_ROLE_HIGHER_BOT;

		return UserHandle.SUCCESS;
	}

	/** @deprecated */
	async resolveUserHandleFromInteraction(interaction: ContextMenuInteraction, handle: UserHandle, user: User): Promise<boolean> {
		switch (handle) {
			case UserHandle.CANNOT_ACTION_SELF:
				await interaction.reply({ content: await this.translate("global_cannot_action_self", interaction.guild?.id, {}), ephemeral: true });
				return true;

			case UserHandle.CANNOT_ACTION_OWNER:
				await interaction.reply({ content: await this.translate("global_cannot_action_owner", interaction.guild?.id, {}), ephemeral: true });
				return true;

			case UserHandle.CANNOT_ACTION_ROLE_EQUAL:
				await interaction.reply({ content: await this.translate("global_cannot_action_role_equal", interaction.guild?.id, { target: user }), ephemeral: true });
				return true;

			case UserHandle.CANNOT_ACTION_BOT_SELF:
				await interaction.reply({ content: await this.translate("global_cannot_action_bot_self", interaction.guild?.id, {}), ephemeral: true });
				return true;

			case UserHandle.CANNOT_ACTION_ROLE_HIGHER:
				await interaction.reply({ content: await this.translate("global_cannot_action_role_equal", interaction.guild?.id, { target: user }), ephemeral: true });
				return true;

			case UserHandle.CANNOT_ACTION_USER_ROLE_EQUAL_BOT:
				await interaction.reply({ content: await this.translate("global_cannot_action_role_equal_bot", interaction.guild?.id, { target: user }), ephemeral: true });
				return true;

			case UserHandle.CANNOT_ACTION_USER_ROLE_HIGHER_BOT:
				await interaction.reply({ content: await this.translate("global_cannot_action_role_equal_bot", interaction.guild?.id, { target: user }), ephemeral: true });
				return true;

			case UserHandle.SUCCESS:
				return false;

			default:
				return false;
		}
	}

	// Supported timezones
	public readonly timezones: Record<string, string> = {
		AEDT: "Australia/Melbourne",
		AEST: "Australia/Brisbane",
		AKDT: "America/Anchorage",
		ANAT: "Asia/Anadyr",
		ART: "America/Buenos_Aires",
		AWST: "Asia/Shanghai",
		AoE: "Pacific/Wallis",
		BST: "Europe/London",
		BTT: "Asia/Dhaka",
		CDT: "America/Chicago",
		CEST: "Europe/Brussels",
		CST: "America/Mexico_City",
		CVT: "Atlantic/Cape_Verde",
		EDT: "America/New_York",
		GMT: "Africa/Accra",
		GST: "Asia/Dubai",
		HDT: "America/Adak",
		HST: "Pacific/Honolulu",
		IST: "Asia/Kolkata",
		JST: "Asia/Tokyo",
		MSK: "Europe/Moscow",
		NUT: "Pacific/Fiji",
		PDT: "America/Los_Angeles",
		UTC: "UTC",
		UZT: "Asia/Tashkent",
		WGST: "America/Nuuk",
		WIB: "Asia/Jakarta",
	};

	// Supported languages
	// dont ask me how this works found it on stackoverflow
	public readonly languages = new Proxy(
		{
			"en-us|english": "en-US",
			"pt-br|portuguese|português": "pt-BR",
			"fr-fr|french|français": "fr-FR",
			"sk-sk|slovak|slovenčina": "sk-SK",
			"sv-se|swedish|svenska": "sv-SE",
			"cs-cz|czech|čeština": "cs-CZ",
			"it-it|italian|italiano": "it-IT",
			"hi-in|hindi|हिंदी": "hi-IN",
		}, // @ts-expect-error
		{ get: (t, p) => Object.keys(t).reduce((r, v) => (r !== undefined ? r : new RegExp(v).test(p) ? t[v] : undefined), undefined) },
	);

	public formatAction(action: string): string | undefined {
		if (!action) return Emotes.actions.WARN;

		return {
			Ban: Emotes.actions.BAN,
			"Manual Ban": Emotes.actions.BAN,
			"Force-ban": Emotes.actions.BAN,
			Kick: Emotes.actions.KICK,
			"Manual Kick": Emotes.actions.KICK,
			Mute: Emotes.actions.MUTE,
			Warn: Emotes.actions.WARN,
			Unmute: Emotes.actions.UNBAN,
			Unwarn: Emotes.actions.UNBAN,
			Nickname: Emotes.other.EDIT,
		}[action];
	}

	public async logError(err: Error, context?: CommandContext, eventName?: string, runArgs?: any): Promise<void> {
		if (process.env.ENVIRONMENT === "dev") throw err;
		const embed = new MessageEmbed()
			.setColor("RED")
			.setTitle(`New Error | ${err.name}`)
			.addField("Name", err.name, true)
			.addField("Message", err.message, true)
			.addField("String", `${err.name}: ${err.message}`, true)
			.setDescription(`**Stack trace:** \n\`\`\`${err.stack}\`\`\``);

		if (context) {
			embed.addField("Guild ID", <string>context?.guild?.id, true);
			embed.addField("User", <string>context.author.id, true);
			embed.addField("Message Content", <string>context.content, true);
		} else if (runArgs) {
			const argsDesc: string[] = [];
			for (const [k, v] of Object.entries(runArgs)) {
				if ((<any>v)?.inviter) (<any>v).user = (<any>v).inviter;
				const additionalInfo =
					typeof v === "object"
						? `${(<any>v)?.guild.name ? "\n*Guild:* " + (<any>v)?.guild.name + " (`" + (<any>v)?.guild.id + "`)" : ""}${
								(<any>v)?.member
									? "\n*Member*: " + (<any>v)?.member.user.tag + " <@" + (<any>v)?.member.id + ">"
									: (<any>v)?.user
									? "\n*User:* " + (<any>v)?.user.tag + " <@" + (<any>v)?.user.id + ">"
									: ""
						  }${
								(<any>v)?.channel && (<any>v)?.channel?.name
									? "\n*Channel:* " + (<any>v)?.channel.name + " <#" + (<any>v)?.channel.id + "> (`" + (<any>v)?.channel.id + ")`"
									: v instanceof GuildChannel
									? "\n*Channel:* <#" + (<any>v)?.id + "> #" + (<any>v)?.name + " (`" + (<any>v)?.id + ")`"
									: ""
						  }`
						: "";
				argsDesc.push(`**${k}:** ${typeof v === "object" ? "[object " + v?.constructor.name + "]" + additionalInfo.trimEnd() : v}`);
			}
			embed.addField("Event Name", `${eventName}`, true);
			embed.addField("Event Arguments", argsDesc.join("\n").slice(0, 1024));
		}

		await (<TextChannel>this.client.channels.cache.get(error)).send({ embeds: [embed] });
	}

	/** Return a list of property keys where the values differ between the two objects */
	public diff<T>(oldObj: T, newObj: T): string[] {
		const diff: string[] = [];
		for (const key of Object.keys(oldObj)) {
			if (!this.objectEquals(oldObj[key], newObj[key])) diff.push(key);
		}
		return diff;
	}

	/** Deep equality check for arrays */
	public arrayEquals<T extends any[]>(firstArray: T, secondArray: T, depth = Infinity) {
		// Allows limiting how deep we drill down to check equality. Passing depth as 1 will
		// only check the first layer of values and not drill into any objects
		if (depth <= 0) return true;
		// If we can pass strict equality then they're equal
		if (firstArray === secondArray) return true;
		if (typeof firstArray !== typeof secondArray) return false;
		// If these are equal, it should be because both are true
		if (firstArray instanceof Array !== secondArray instanceof Array) return false;
		// Don't call this function if you can't guarantee at least one of the arguments is an Array
		// if (typeof firstArray !== "object") return firstArray === secondArray;
		// @ts-expect-error
		if ("equals" in firstArray && typeof firstArray.equals === "function") return firstArray.equals(secondArray);
		if (firstArray.length !== secondArray.length) return false;
		const len = firstArray.length;
		for (let i = 0; i < len; i++) {
			if (firstArray[i] !== secondArray[i]) {
				if (firstArray[i] instanceof Array) {
					if (!this.arrayEquals(firstArray[i], secondArray[i], depth - 1)) return false;
				} else {
					// This will handle objects as well as things like NaN,
					// which could be both values here as NaN !== NaN
					if (!this.objectEquals(firstArray[i], secondArray[i], depth - 1)) return false;
				}
			}
		}
		return true;
	}

	/** Deep equality check for objects */
	public objectEquals<T>(firstObject: T, secondObject: T, depth = Infinity) {
		// Allows limiting how deep we drill down to check equality. Passing depth as 1 will
		// only check the first layer of properties and not drill into any objects
		if (depth <= 0) return true;
		// If we can pass strict equality then they're equal
		if (firstObject === secondObject) return true;
		if (typeof firstObject !== typeof secondObject) return false;
		if (typeof firstObject !== "object" || !firstObject || !secondObject) {
			if (typeof firstObject === "number") {
				// isNaN will coerce anything to a number, so isNaN({}) is true apparently.
				// NaN !== NaN so they would fail strict equality
				if (isNaN(firstObject)) return isNaN(secondObject as unknown as number);
			}
			return false;
		}
		// ASSERTION: These should be guaranteed known at this point
		// typeof firstObject === "object" && typeof secondObject === "object"
		// firstObject !== null && secondObject !== null

		// @ts-expect-error This allows a .equals function to be provided to customize behavior
		if ("equals" in firstObject && typeof firstObject.equals === "function") {
			// @ts-expect-error
			return firstObject.equals(secondObject);
		}
		for (const propertyName of Object.keys(firstObject)) {
			// Ensure every key in firstObject is in secondObject
			if (!(propertyName in secondObject)) {
				return false;
			}
		}
		for (const propertyName of Object.keys(secondObject)) {
			// Ensure every key in secondObject is in firstObject
			if (!(propertyName in firstObject)) {
				return false;
			}
			// Functions of the same name from the same prototype (i.e. the same function)
			// but on different objects are strictly equal, so they will pass this check
			if (firstObject[propertyName] !== secondObject[propertyName]) {
				// If any property mismatch, we will consider the objects not equal
				if (typeof firstObject[propertyName] !== typeof secondObject[propertyName]) {
					return false;
				} else if (firstObject[propertyName] instanceof Array && secondObject[propertyName] instanceof Array) {
					if (!this.arrayEquals(firstObject[propertyName], secondObject[propertyName], depth - 1)) return false;
				} else if (typeof firstObject[propertyName] === "object") {
					if (!this.objectEquals(firstObject[propertyName], secondObject[propertyName], depth - 1)) return false;
				} else {
					if (typeof firstObject[propertyName] === "number") {
						// We know their typeof values match but they fail strict equality,
						// so if either is typeof "number", both must be NaN or else they cannot be equal
						if (isNaN(firstObject[propertyName])) return isNaN(secondObject[propertyName]);
					}
					return false;
				}
			}
		}
		return true;
	}
}
