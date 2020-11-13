export class EventHandler {
    didTimeout?: Function;
    didSet?: (remainingTime: number) => void;
}
