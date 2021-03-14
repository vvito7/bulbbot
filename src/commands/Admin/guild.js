const Command = require("../../structures/Command");
const DeleteGuild = require("../../utils/guilds/DeleteGuild");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			description: "Runs actions on a given guild",
			category: "Admin",
			usage: "!guild <action> <guild id>",
			examples: ["guild"],
			minArgs: 2,
			maxArgs: -1,
			argList: ["code:string"],
			devOnly: true,
		});
	}

	async run(message, args) {
	
		switch (args[0].toLowerCase()) {
			case "db-yeet":
				await DeleteGuild(guild.id);
				message.channel.send("success deleted that guild from the database")
				break;
		
			default:
				break;
		}
	}
};
