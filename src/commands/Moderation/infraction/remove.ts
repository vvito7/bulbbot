import { ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton, Snowflake } from "discord.js";
import InfractionsManager from "../../../utils/managers/InfractionsManager";
import BulbBotClient from "../../../structures/BulbBotClient";
import ApplicationSubCommand from "../../../structures/ApplicationSubCommand";
import ApplicationCommand from "../../../structures/ApplicationCommand";
import { ApplicationCommandOptionType } from "discord-api-types/v10";

const infractionsManager: InfractionsManager = new InfractionsManager();

export default class extends ApplicationSubCommand {
	constructor(client: BulbBotClient, parent: ApplicationCommand) {
		super(client, parent, {
			name: "delete",
			description: "Delete an infraction",
			options: [
				{
					name: "id",
					type: ApplicationCommandOptionType.Integer,
					description: "The ID of the infraction",
					required: true,
					min_value: 1,
					max_value: 2147483647,
				},
			],
		});
	}

	public async run(interaction: CommandInteraction): Promise<void> {
		const infractionId: number = interaction.options.getInteger("id") as number;
		const inf = await infractionsManager.getInfraction(interaction.guild?.id as Snowflake, infractionId);

		if (!inf) {
			return interaction.reply({
				content: await this.client.bulbutils.translate("infraction_not_found", interaction.guild?.id, {
					infraction_id: infractionId,
				}),
				ephemeral: true,
			});
		}

		// Possibly implement permission checking here. Awaiting input from the team

		const target = { tag: inf.target, id: inf.targetId };
		const moderator = { tag: inf.moderator, id: inf.moderatorId };

		const row = new MessageActionRow().addComponents([
			new MessageButton().setLabel("Confirm").setStyle("SUCCESS").setCustomId("confirm"),
			new MessageButton().setLabel("Cancel").setStyle("DANGER").setCustomId("cancel"),
		]);

		await interaction.reply({
			content: await this.client.bulbutils.translate("infraction_delete_confirm", interaction.guild?.id, {
				infraction_id: inf.id,
				moderator,
				target,
				reason: inf["reason"],
			}),
			components: [row],
			ephemeral: true,
		});

		const collector = interaction.channel?.createMessageComponentCollector({ time: 30000 });

		collector?.on("collect", async (i: ButtonInteraction) => {
			if (i.customId === "confirm") {
				await i.reply({
					content: await this.client.bulbutils.translate("infraction_delete_success", interaction.guild?.id, {
						infraction_id: infractionId,
					}),
					components: [],
				});

				await interaction.editReply({
					content: await this.client.bulbutils.translate("ban_message_dismiss", interaction.guild?.id, {}),
					components: [],
				});

				collector.stop("clicked");
				return void (await infractionsManager.deleteInfraction(interaction.guild?.id as Snowflake, infractionId));
			} else {
				collector.stop("clicked");
				return void (await interaction.editReply({
					content: await this.client.bulbutils.translate("global_execution_cancel", interaction.guild?.id, {}),
					components: [],
				}));
			}
		});

		collector?.on("end", async (_: ButtonInteraction, reason: string) => {
			if (reason !== "time") return;

			return void (await interaction.editReply({ content: await this.client.bulbutils.translate("global_execution_cancel", interaction.guild?.id, {}), components: [] }));
		});
	}
}
