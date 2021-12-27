import { Sequelize } from "sequelize";

export default function (sequelize: Sequelize) {
	const { guild, guildConfiguration, guildLogging, guildModerationRoles, guildOverrideCommands, infraction, tempban, automod, banpools, banpoolSubscribers, messageLog, experiment } = sequelize.models;

	guild.belongsTo(guildConfiguration, {});
	guild.belongsTo(guildLogging, {});

	guild.belongsTo(automod, {});

	guild.hasMany(infraction, {});
	guild.hasMany(guildModerationRoles, {});
	guild.hasMany(guildOverrideCommands, {});

	guild.hasMany(tempban, {});

	guild.hasMany(banpools, {});
	banpools.hasMany(banpoolSubscribers, {});

	guild.hasMany(messageLog, {});
	guild.hasMany(experiment, {});
}
