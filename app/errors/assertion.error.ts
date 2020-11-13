export class AssertionError extends Error {
    isOK: boolean = false;
    constructor(message?: string) {
        super(message);
        this.name = 'assertionError(_:)';
        this.message = message ?? '';
    }
}
