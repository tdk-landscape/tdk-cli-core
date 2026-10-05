export function createStatusMessageController(setMessage) {
    let timer;
    return {
        show(message, durationMs = 1500) {
            if (timer !== undefined) {
                clearTimeout(timer);
            }
            setMessage(message);
            timer = setTimeout(() => {
                timer = undefined;
                setMessage("");
            }, durationMs);
        },
        dispose() {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
        },
    };
}
//# sourceMappingURL=status-message.js.map