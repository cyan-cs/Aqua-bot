const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('ヘルプを表示します。'),
    async executeSlash(interaction) {
        const readmeUrl = 'https://github.com/cyan-cs/DiscordBOT-cs';
        const supportServerUrl = 'https://discord.gg/g5jur2YHc3';

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('mms-help')
            .setDescription(`コマンド一覧: [GitHub](${readmeUrl}) \n サポート鯖: [しあん鯖](${supportServerUrl})`)
            .setFooter({
                text: `実行者: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
