export class ConflictError extends Error {
    isOK: boolean = false;
    constructor(message?: string) {
        super(message);
        this.name = 'conflictError(_:)';
        this.message = message ?? '';
    }
}
