const { MiQ } = require('makeitaquote');
const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      // Bot自身のメッセージは無視
      if (message.author.bot) return;

      // 条件: このBotにメンションかつ 'make it' を含む
      const contentLower = message.content.toLowerCase();
      const isMentioned = message.mentions.has(message.client.user);
      const hasMakeIt = contentLower.includes('make it');

      if (!(isMentioned && hasMakeIt)) return;

      // 返信先メッセージがなければエラー
      if (!message.reference || !message.reference.messageId) {
        await message.reply('❌ このコマンドは返信メッセージに対して使ってください。');
        return;
      }

      let repliedMsg;
      try {
        repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
      } catch (fetchError) {
        logger.error('返信先メッセージの取得に失敗:', fetchError);
        await message.reply('❌ 返信先のメッセージが取得できませんでした。');
        return;
      }

      const user = repliedMsg.author;

      let buffer;
      try {
        buffer = await new MiQ()
          .setText(repliedMsg.content || '[埋め込みや添付ファイルの可能性あり]')
          .setAvatar(user.displayAvatarURL({ format: 'png', size: 1024 }))
          .setDisplayname(user.username)   // 表示名
          .setUsername(user.tag)          // @username#1234の形式（薄い文字）
          .setColor(true)
          .setWatermark('まかろに#5611')
          .generate(true);
      } catch (generateError) {
        logger.error('Make it a Quote生成エラー:', generateError);
        await message.reply('❌ 画像生成に失敗しました。');
        return;
      }

      try {
        await message.reply({
          files: [{ attachment: buffer, name: 'quote.png' }]
        });
      } catch (replyError) {
        logger.error('返信メッセージ送信に失敗:', replyError);
      }

    } catch (fatalError) {
      logger.error('messageCreateイベントで予期せぬエラー:', fatalError);
    }
  }
};
