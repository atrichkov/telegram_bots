const commandArgs = () => (ctx, next) => {
    // console.log(ctx.updateType);
    // console.log(ctx.updateSubType)
    if (ctx.updateType === 'message') { // && ctx.updateSubType === 'text'
        const text = ctx.update.message.text
        if (text.startsWith('/')) {
            const match = text.match(/^\/([^\s]+)\s?(.+)?/);
            let args = [];
            let command;
            if (match !== null) {
                if (match[1]) {
                    command = match[1];
                }
                if (match[2]) {
                    args = match[2].split(' ');
                }
            }

            ctx.state.command = {
                raw: text,
                command,
                args,
            };
        }
    }
    return next();
};

module.exports = commandArgs;