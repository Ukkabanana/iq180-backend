import { EventHandler } from '../@types/time-interval';
import { Timer } from './timer';

export class TimeInterval extends Timer {
    private eventHandler: EventHandler;

    timeFrame: number;
    remainingTime: number;

    constructor(timeFrame: number, eventHandler: EventHandler) {
        super({
            onInterval: () => this.onTimerInterval(),
            onRestart: () => this.onTimerRestart(),
            onReset: () => this.onTimerReset(),
        });

        this.eventHandler = eventHandler;
        this.timeFrame = timeFrame;
        this.remainingTime = timeFrame;
    }

    private onTimerInterval() {
        if (this.remainingTime === 0) {
            this.remainingTime = this.timeFrame;
            this.eventHandler.didTimeout && this.eventHandler.didTimeout();
            this.eventHandler.didSet && this.eventHandler.didSet(this.remainingTime);
        } else {
            this.remainingTime = this.remainingTime - 1;
            this.eventHandler.didSet && this.eventHandler.didSet(this.remainingTime);
        }
    }

    private onTimerRestart() {
        this.remainingTime = this.timeFrame;
        this.eventHandler.didSet && this.eventHandler.didSet(this.remainingTime);
    }

    private onTimerReset() {
        this.remainingTime = this.timeFrame;
        this.eventHandler.didSet && this.eventHandler.didSet(this.remainingTime);
    }
}
