import { Player as PlayerI } from '../@types/player';

export class Player implements PlayerI {
    UID: string;
    name: string;
    currentScore: number;
    timeUsed: number;
    hasPlayed: boolean;

    constructor(UID: string, name: string, currentScore: number = 0, timeUsed: number = 60) {
        this.UID = UID;
        this.name = name;
        this.currentScore = currentScore;

        // Other properties
        this.timeUsed = timeUsed;
        this.hasPlayed = false;
    }

    reset() {
        this.currentScore = 0;
        this.hasPlayed = false;
    }

    setTimeUsed(timeUsed: number) {
        this.timeUsed = timeUsed;
    }

    setHasPlayed(hasPlayed: boolean) {
        this.hasPlayed = hasPlayed;
    }
}
