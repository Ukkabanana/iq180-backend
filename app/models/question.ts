import { evaluate } from 'mathjs';
import { nanoid } from 'nanoid';
import { randomNumber } from '../functions/random';
import { shuffle } from '../functions/shuffle';

export class Question {
    QID: string;
    numbers: number[];
    expectedAnswer: number;

    static availableOperators = ['+', '-', '*', '/'];

    constructor() {
        let generated = this.generate();
        this.QID = nanoid(5);
        this.numbers = generated.numbers;
        this.expectedAnswer = generated.expectedAnswer;
    }

    private generate(): { numbers: number[]; expectedAnswer: number } {
        let numbers = new Array(5).fill(undefined).map((_) => randomNumber(0, 9));
        let expectedAnswer = this.getExpectedAnswer(numbers);

        return {
            numbers,
            expectedAnswer,
        };
    }

    private getExpectedAnswer(numbers: number[]): number {
        let copy = numbers.slice();

        if (copy.length >= 2) {
            let operators = Question.availableOperators;
            let first = copy[0];
            let second = copy[1];

            let operator = operators[randomNumber(0, operators.length)];
            let result = evaluate([first, operator, second].join(' '));

            // 1. Whole number
            // 2. Positive number
            // 3. Finite
            while (Math.floor(result) !== result || result < 0 || !Number.isFinite(result)) {
                operator = operators[randomNumber(0, operators.length)];
                result = evaluate([first, operator, second].join(' '));
            }

            copy.splice(0, 2);
            let _copy = [...copy, result];
            _copy = shuffle(_copy);

            return this.getExpectedAnswer(_copy);
        }

        return copy[0];
    }
}
