const { SlashCommandBuilder } = require('discord.js');
const { MiQ } = require('makeitaquote');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fmakeit')
    .setDescription('指定した人の名前とアイコンでセリフの偽引用画像を作る')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('ターゲット')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('text')
        .setDescription('ターゲットに言わせる言葉')
        .setRequired(true)),

  async executeSlash(interaction) {
    const targetUser = interaction.options.getUser('target');
    const text = interaction.options.getString('text');

    try {
      // 生成処理
      const buffer = await new MiQ()
        .setText(text)
        .setAvatar(targetUser.displayAvatarURL({ format: 'png', size: 128 }))
        .setDisplayname(targetUser.username)
        .setUsername(targetUser.tag)
        .setColor(true)
        .setWatermark('まかろに#5611')
        .generate(true);

      // 返信送信
      await interaction.reply({ files: [{ attachment: buffer, name: 'fakequote.png' }] });

    } catch (error) {
      console.error('偽引用画像生成エラー:', error);

      // 例外がAPI通信エラーなら内容を詳しく送る（APIのレスポンスあるなら）
      if (error.response) {
        await interaction.reply({ 
          content: `画像生成でAPIエラーが発生しました。\nStatus: ${error.response.status}\nMessage: ${JSON.stringify(error.response.data)}`, 
          ephemeral: true 
        });
      } else {
        // それ以外は一般エラー通知
        await interaction.reply({ content: '画像生成に失敗しました。', ephemeral: true });
      }
    }
  }
};
