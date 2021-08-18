import Command from "../../structures/Command";
import { ButtonInteraction, Guild, GuildMember, Message, MessageActionRow, MessageButton, Snowflake } from "discord.js";
import { NonDigits } from "../../utils/Regex";
import DatabaseManager from "../../utils/managers/DatabaseManager";
import InfractionsManager from "../../utils/managers/InfractionsManager";
import { MuteType } from "../../utils/types/MuteType";
import BulbBotClient from "../../structures/BulbBotClient";

const databaseManager: DatabaseManager = new DatabaseManager();
const infractionsManager: InfractionsManager = new InfractionsManager();

export default class extends Command {
	constructor(client: BulbBotClient, name: string) {
		super(client, {
			name,
			description: "Unutes the selected user",
			category: "Moderation",
			usage: "<member> [reason]",
			examples: ["unmute 123456789012345678", "unmute 123456789012345678 nice user", "unmute @Wumpus#0000 nice user"],
			argList: ["member:Member"],
			minArgs: 1,
			maxArgs: -1,
			clearance: 50,
		});
	}

	public async run(message: Message, args: string[]): Promise<void | Message> {
		await message.guild?.members.fetch();
		const targetID: Snowflake = args[0].replace(NonDigits, "");
		const target: GuildMember | null = targetID ? <GuildMember>await message.guild?.members.fetch(targetID).catch(() => null) : null;
		const muteRole: Snowflake = <Snowflake>await databaseManager.getMuteRole(<Snowflake>message.guild?.id);
		let reason: string = args.slice(1).join(" ");
		let infID: number;

		if (!reason) reason = await this.client.bulbutils.translate("global_no_reason", message.guild?.id, {});
		if (!muteRole) return message.channel.send(await this.client.bulbutils.translate("mute_muterole_not_found", message.guild?.id, {}));
		if (!target)
			return message.channel.send(
				await this.client.bulbutils.translate("global_not_found", message.guild?.id, {
					type: await this.client.bulbutils.translate("global_not_found_types.member", message.guild?.id, {}),
					arg_provided: args[0],
					arg_expected: "member:Member",
					usage: this.usage,
				}),
			);
		if (!target.roles.cache.find(role => role.id === muteRole)) return message.channel.send(await this.client.bulbutils.translate("mute_not_muted", message.guild?.id, { target: target.user }));

		const latestMute: Record<string, any> = <Record<string, any>>await infractionsManager.getLatestMute(<Snowflake>message.guild?.id, target.user.id);
		let confirmMsg: Message;

		if (latestMute) {
			infID = await infractionsManager.unmute(
				this.client,
				<Guild>message.guild,
				MuteType.MANUAL,
				target,
				message.author,
				await this.client.bulbutils.translate("global_mod_action_log", message.guild?.id, {
					action: await this.client.bulbutils.translate("mod_action_types.unmute", message.guild?.id, {}),
					moderator: message.author,
					target: target.user,
					reason: reason,
				}),
				reason,
				muteRole,
			);

			const latestMute: Record<string, any> = <Record<string, any>>await infractionsManager.getLatestMute(<Snowflake>message.guild?.id, target.user.id);
			await infractionsManager.setActive(<Snowflake>message.guild?.id, latestMute["id"], false);

			await message.channel.send(
				await this.client.bulbutils.translate("action_success", message.guild?.id, {
					action: await this.client.bulbutils.translate("mod_action_types.unmute", message.guild?.id, {}),
					target,
					reason,
					infraction_id: infID,
				}),
			);
		} else {
			const row = new MessageActionRow().addComponents([
				new MessageButton().setStyle("SUCCESS").setLabel("Confirm").setCustomId("confirm"),
				new MessageButton().setStyle("DANGER").setLabel("Cancel").setCustomId("cancel"),
			]);

			confirmMsg = await message.channel.send({
				content: await this.client.bulbutils.translate("unmute_confirm", message.guild?.id, {
					target: target.user,
				}),
				components: [row],
			});

			const filter = (i: ButtonInteraction) => i.user.id === message.author.id;
			await confirmMsg
				.awaitMessageComponent({ filter, time: 15000 })
				.then(async (interaction: ButtonInteraction) => {
					if (interaction.customId === "confirm") {
						await confirmMsg.delete();
						await target.roles.remove(muteRole);
						await message.channel.send(
							await this.client.bulbutils.translate("unmute_special", message.guild?.id, {
								target: target.user,
								reason,
							}),
						);
					} else {
						await confirmMsg.delete();
						await message.channel.send(await this.client.bulbutils.translate("global_execution_cancel", message.guild?.id, {}));
					}
				})
				.catch(async _ => {
					await confirmMsg.delete();
					await message.channel.send(await this.client.bulbutils.translate("global_execution_cancel", message.guild?.id, {}));
				});
		}
	}
}