import { interval, Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { CompletionHandler } from '../@types/timer';

export class Timer {
    private completion: CompletionHandler;
    private interval$: Observable<number> | undefined;
    private isStopped$: Subject<boolean>;

    constructor(completion: CompletionHandler) {
        this.completion = completion;
        this.interval$ = undefined;
        this.isStopped$ = new Subject();
    }

    start() {
        this.interval$ = interval(1000);
        this.interval$
            .pipe(
                tap((_) => this.onInterval()),
                takeUntil(this.isStopped$),
            )
            .subscribe();
        this.completion.onStart && this.completion.onStart();
    }

    private onInterval() {
        this.completion.onInterval && this.completion.onInterval();
    }

    stop() {
        this.isStopped$.next(true);
        this.interval$ = undefined;
        this.completion.onStop && this.completion.onStop();
    }

    restart() {
        this.stop();
        this.completion.onRestart && this.completion.onRestart();
        this.start();
    }

    reset() {
        this.stop();
        this.completion.onReset && this.completion.onReset();
    }

    onBeforeDestroy() {
        this.stop();
        this.isStopped$.complete();
        this.completion.onBeforeDestroy && this.completion.onBeforeDestroy();
    }
}
