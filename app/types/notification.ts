import { Event } from './event';

export interface Notification {
    event: Event;
    payload: any;
}
