import BulbBotClient from "../../structures/BulbBotClient";
import ApplicationCommand from "../../structures/ApplicationCommand";
import { ApplicationCommandType } from "discord-api-types/v10";
import create from "./banpool/create";

export default class extends ApplicationCommand {
	constructor(client: BulbBotClient, name: string) {
		super(client, {
			name,
			description: "Manage banpools",
			type: ApplicationCommandType.ChatInput,
			options: [],
			subCommands: [create],
			command_permissions: ["ADMINISTRATOR"],
			client_permissions: ["BAN_MEMBERS"],
		});
	}
}
