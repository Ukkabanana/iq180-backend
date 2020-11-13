export class PreconditionError extends Error {
    isOK: boolean = false;
    constructor(message?: string) {
        super(message);
        this.name = 'preconditionError(_:)';
        this.message = message ?? '';
    }
}
