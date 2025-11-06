const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addMessageId } = require('../../utils/jsonStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-i')
        .setDescription('このサーバーの情報を表示します。'),

    /**
     * おしゃれで見やすいサーバー情報Embedを作成
     * @param {import('discord.js').Guild} guild 
     * @returns {EmbedBuilder}
     */
    createServerInfoEmbed(guild) {
        return new EmbedBuilder()
            .setColor(0x00BFFF) // 水色で統一
            .setTitle(`${guild.name} の情報`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 128 }))
            .addFields(
                { name: 'サーバー名', value: guild.name, inline: true },
                { name: 'サーバーID', value: guild.id, inline: true },
                { name: 'メンバー数', value: guild.memberCount.toLocaleString(), inline: true },
                { name: '作成日', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
                { name: 'オーナー', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'ロール数', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'チャンネル数', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'サーバーブーストレベル', value: `${guild.premiumTier || 'なし'}`, inline: true },
                { name: '絵文字の数', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '地域', value: guild.preferredLocale, inline: true }
            )
            .setFooter({ text: 'サーバー情報' })
            .setTimestamp();
    },

    async executeSlash(interaction) {
        const guild = interaction.guild;
        if (!guild) return interaction.reply('サーバー情報を取得できませんでした。');

        try {
            const embed = this.createServerInfoEmbed(guild);
            const sentMsg = await interaction.reply({ embeds: [embed], fetchReply: true });

            await sentMsg.react('🗑️'); // ゴミ箱リアクション
            await addMessageId(sentMsg.id);

        } catch (err) {
            console.error('server-i Slash エラー:', err);
            await interaction.reply({ content: '情報取得中にエラーが発生しました。', ephemeral: true });
        }
    },

    async executeMessage(message) {
        const guild = message.guild;
        if (!guild) return message.reply('サーバー情報を取得できませんでした。');

        try {
            const embed = this.createServerInfoEmbed(guild);
            const sentMsg = await message.reply({ embeds: [embed] });

            await sentMsg.react('🗑️');
            await addMessageId(sentMsg.id);

        } catch (err) {
            console.error('server-i Prefix エラー:', err);
            await message.reply('情報取得中にエラーが発生しました。');
        }
    }
};
