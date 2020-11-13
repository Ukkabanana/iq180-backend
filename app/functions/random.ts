export function randomNumber(inclusiveMin: number, exclusiveMax: number): number {
    let min = Math.ceil(inclusiveMin);
    let max = Math.floor(exclusiveMax);
    return Math.floor(Math.random() * (max - min) + min);
}
