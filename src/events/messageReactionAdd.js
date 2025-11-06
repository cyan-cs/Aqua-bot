const logger = require('../utils/logger.js');
const {
    readMessageIds,
    removeMessageId
} = require('../utils/jsonStore.js');

module.exports = {
    name: 'messageReactionAdd',

    async execute(reaction, user) {
        try {
            // partialリアクションの補完
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                    logger.debug('[DEBUG] リアクションを fetch 成功');
                } catch (err) {
                    logger.warn('リアクションの fetch に失敗:', err?.stack || err?.message || String(err));
                    return;
                }
            }

            const message = reaction.message;
            const emoji = reaction.emoji;

            // 基本チェック
            if (user.bot) return;
            if (!message || !message.id || !message.author) {
                logger.warn('[WARN] message が不完全なため処理スキップ');
                return;
            }
            if (emoji.name !== '🗑️') return;

            // JSONファイルから対象IDを取得
            const trackedIds = await readMessageIds();
            const isTrackedMessage = trackedIds.includes(message.id);
            const isBotMessage = message.author.bot;

            logger.debug(`[DEBUG] チェック結果: isTracked=${isTrackedMessage}, isBotMsg=${isBotMessage}, msgID=${message.id}`);

            if (!isTrackedMessage || !isBotMessage) {
                logger.debug('[DEBUG] 対象外メッセージのため削除しません');
                return;
            }

            // メッセージ削除処理
            try {
                await message.delete();
                await removeMessageId(message.id);
                logger.info(`🗑️ ${user.tag} がメッセージ (${message.id}) を削除し、JSON から除去しました`);
            } catch (deleteErr) {
                logger.error('メッセージ削除に失敗:', deleteErr?.stack || deleteErr?.message || String(deleteErr));
            }
        } catch (e) {
            logger.error('リアクション処理中の致命的エラー:', e?.stack || e?.message || String(e));
        }
    }
};
