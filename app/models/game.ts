import { evaluate, parse } from 'mathjs';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { Event } from '../@types/event';
import { State } from '../@types/game';
import { Notification } from '../@types/notification';
import { ConflictError } from '../errors/conflict.error';
import { InvalidExpressionError } from '../errors/invalid-expression.error';
import { PreconditionError } from '../errors/precondition.error';
import { randomNumber } from '../functions/random';
import { Player } from './player';
import { Question } from './question';
import { TimeInterval } from './time-interval';

const __DEV__ = process.env.NODE_ENV === 'development';

export class Game {
    private currentState$: BehaviorSubject<State>;

    players$: BehaviorSubject<Player[]>;
    private currentPlayer$: BehaviorSubject<Player | null>;

    private questions: Question[];
    private currentQuestion$: BehaviorSubject<Question | null>;

    private isDestroyed$: ReplaySubject<boolean>;

    private timeInterval: TimeInterval;
    private isFirstRun: boolean;

    //
    private timeFrame = 60;
    private numberOfQuestions = 3;

    notification$: Subject<Notification>;

    constructor() {
        this.currentState$ = new BehaviorSubject<State>(State.WAITING);
        this.players$ = new BehaviorSubject<Player[]>([]);
        this.isDestroyed$ = new ReplaySubject();
        this.currentPlayer$ = new BehaviorSubject<Player | null>(null);
        this.notification$ = new Subject<Notification>();
        this.isFirstRun = true;
        this.questions = new Array(this.numberOfQuestions).fill(undefined).map((_) => new Question());
        // console.log(this.questions);
        this.currentQuestion$ = new BehaviorSubject<Question | null>(null);

        this.timeInterval = new TimeInterval(this.timeFrame, {
            didTimeout: () => this.nextPlayer(),
            didSet: (remainingTime: number) => {
                this.notification$.next({
                    event: Event.SET_REMAINING_TIME,
                    payload: remainingTime,
                });
            },
        });

        this.registerSubscriptions();
    }

    private registerSubscriptions() {
        this.currentPlayer$
            .pipe(
                tap((currentPlayer: Player | null) => {
                    if (currentPlayer) {
                        currentPlayer.setHasPlayed(true);
                    }

                    this.notification$.next({
                        event: Event.SET_CURRENT_PLAYER,
                        payload: currentPlayer?.UID,
                    });
                }),
                takeUntil(this.isDestroyed$),
            )
            .subscribe();

        this.currentState$
            .pipe(
                tap((currentState: State) => {
                    this.notification$.next({
                        event: Event.SET_CURRENT_STATE,
                        payload: currentState,
                    });
                }),
                takeUntil(this.isDestroyed$),
            )
            .subscribe();

        this.players$
            .pipe(
                tap((players: Player[]) => {
                    this.notification$.next({
                        event: Event.SET_PLAYERS,
                        payload: players,
                    });
                }),
                takeUntil(this.isDestroyed$),
            )
            .subscribe();

        this.currentQuestion$
            .pipe(
                tap((currentQuestion: Question | null) => {
                    this.notification$.next({
                        event: Event.SET_CURRENT_QUESTION,
                        payload: currentQuestion,
                    });
                }),
                takeUntil(this.isDestroyed$),
            )
            .subscribe();
    }

    /* Event Handlers */

    start() {
        if (this.isOngoing || this.players$.value.length < 2) {
            throw new PreconditionError(
                'Cannot start game while the game is ongoing or number of players is less than 2',
            );
        }

        this.questions = new Array(this.numberOfQuestions).fill(undefined).map((_) => new Question());

        // Reset
        let players = this.players$.value;
        players.forEach((player) => player.reset());
        this.players$.next(players);

        if (this.isFirstRun) {
            // Random
            let player = players[randomNumber(0, players.length)];
            this.currentPlayer$.next(player);
            this.isFirstRun = false;
        } else {
            let currentPlayer = this.currentPlayer$.value;
            if (currentPlayer) {
                let currentPlayerIndex = players.findIndex((player) => player.UID === currentPlayer!.UID);
                if (currentPlayerIndex === -1) {
                    let player = players[randomNumber(0, players.length)];
                    this.currentPlayer$.next(player);
                } else {
                    this.currentPlayer$.next(this.currentPlayer$.value);
                }
            } else {
                let player = players[randomNumber(0, players.length)];
                this.currentPlayer$.next(player);
            }
        }

        this.currentQuestion$.next(this.questions[0]);
        this.currentState$.next(State.ONGOING);
        this.timeInterval.restart();
    }

    nextPlayer() {
        // Check
        this.timeInterval.stop();

        let players = this.players$.value;
        let currentPlayer = this.currentPlayer$.value!;
        let currentPlayerIndex = players.findIndex((player) => player.UID === currentPlayer.UID);
        let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        let nextPlayer = players[nextPlayerIndex];

        if (players.every((player) => player.hasPlayed)) {
            // Next Question
            let minimumTimeUsed = Math.min(...players.map((player) => player.timeUsed));
            players.forEach((player) => {
                if (player.timeUsed === minimumTimeUsed) {
                    player.currentScore++;
                }
                player.setTimeUsed(this.timeFrame);
                player.setHasPlayed(false);
            });

            this.players$.next(players);

            let currentQuestion = this.currentQuestion$.value!;
            let currentQuestionIndex = this.questions.findIndex((q) => q.QID === currentQuestion.QID);
            if (currentQuestionIndex !== this.questions.length - 1) {
                let nextQuestionIndex = currentQuestionIndex + 1;
                this.currentQuestion$.next(this.questions[nextQuestionIndex]);
            } else {
                // End
                this.end();
                return;
            }
        }

        this.currentPlayer$.next(nextPlayer);
        this.timeInterval.restart();
    }

    end() {
        this.timeInterval.reset();
        let winner = this.players$.value.reduce((previousPlayer, currentPlayer) => {
            if (previousPlayer.currentScore <= currentPlayer.currentScore) {
                return currentPlayer;
            } else {
                return previousPlayer;
            }
        });
        this.currentPlayer$.next(winner);
        this.currentState$.next(State.FINISHED);
        this.currentState$.next(State.WAITING);
    }

    reset() {
        this.isFirstRun = false;
        let players = this.players$.value;
        players.forEach((player) => player.reset());
        this.players$.next(players);
        this.currentPlayer$.next(null);
        this.currentState$.next(State.WAITING);
    }

    playerDidJoin(UID: string, name: string, onBeforeJoin?: Function): boolean {
        if (this.isOngoing) {
            throw new PreconditionError('Cannot join game while the game is ongoing');
        }

        onBeforeJoin && onBeforeJoin();

        let players = this.players$.value;

        if (!players.find((player) => player.UID === UID)) {
            let player = new Player(UID, name, 0, this.timeFrame);
            players = [...players, player];
            this.players$.next(players);

            if (__DEV__ && players.length === 2) {
                this.start();
            }

            return true;
        }

        throw new ConflictError();
    }

    playerDidLeave(UID: string): boolean {
        if (this.isOngoing && this.currentPlayer$.value?.UID === UID) {
            if (this.players$.value.length < 2) {
                this.end();
                return true;
            }

            this.nextPlayer();
        }

        let players = this.players$.value;
        let index = players.findIndex((player) => player.UID === UID);
        if (index !== -1) {
            players.splice(index, 1);
            this.players$.next(players);

            if (this.isOngoing && this.players$.value.length < 2) {
                this.end();
            }

            return true;
        }

        return false;
    }

    playerDidSubmit(UID: string, mathExpression: string): boolean {
        if (this.currentPlayer$.value?.UID !== UID) {
            throw new PreconditionError();
        }

        // Check `mathExpression`
        let currentQuestion = this.currentQuestion$.value;

        //
        if (this.isValidSubmission(mathExpression, currentQuestion!)) {
            let timeUsed = this.timeInterval.timeFrame - this.timeInterval.remainingTime;
            this.currentPlayer$.value!.setTimeUsed(timeUsed);
            this.nextPlayer();
            return true;
        }

        throw new InvalidExpressionError();
    }

    private isValidSubmission(mathExpression: string, question: Question): boolean {
        const result = evaluate(mathExpression);

        if (result === question.expectedAnswer) {
            const nodes = parse(mathExpression);
            nodes.forEach((node) => {
                switch (node.type) {
                    case 'ConstantNode':
                        if (!question.numbers.find((n) => n === node.value)) {
                            return false;
                        }
                        break;
                    case 'OperatorNode':
                        if (!Question.availableOperators.find((n) => n === node.value)) {
                            return false;
                        }
                        break;
                }
            });
            return true;
        }

        return false;
    }

    onBeforeDestroy() {
        this.isDestroyed$.next(true);
        this.isDestroyed$.complete();

        this.notification$.complete();
        this.currentState$.complete();
        this.currentQuestion$.complete();
        this.currentPlayer$.complete();

        this.timeInterval.onBeforeDestroy();
    }

    get isWaiting(): boolean {
        return this.currentState$.value === State.WAITING;
    }

    get isOngoing(): boolean {
        return this.currentState$.value === State.ONGOING;
    }

    get isFinished(): boolean {
        return this.currentState$.value === State.FINISHED;
    }
}
