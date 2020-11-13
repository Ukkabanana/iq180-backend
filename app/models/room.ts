import * as nanoid from 'nanoid';
import { PreconditionError } from '../errors/precondition.error';
import { Game } from './game';

export class Room {
    code: string;
    game: Game;
    maxNumberOfPlayers = 2;

    constructor() {
        this.code = this.generateCode();
        this.game = new Game();
    }

    generateCode(size: number = 5): string {
        return nanoid.customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', size)();
    }

    /* Event Handlers */

    playerDidJoin(UID: string, name: string, onBeforeJoin?: Function): boolean {
        // console.log('[room.ts] playerDidJoin', UID);

        if (this.game.players$.value.length >= this.maxNumberOfPlayers) {
            throw new PreconditionError('Max number of players reached');
        }

        return this.game.playerDidJoin(UID, name, onBeforeJoin);
    }

    playerDidLeave(UID: string): boolean {
        // console.log('[room.ts] playerDidLeave', UID);
        return this.game.playerDidLeave(UID);
    }
}
