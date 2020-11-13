export class InvalidExpressionError extends Error {
    isOK: boolean = false;
    constructor(message?: string) {
        super(message);
        this.name = 'invalidExpressionError(_:)';
        this.message = message ?? '';
    }
}
