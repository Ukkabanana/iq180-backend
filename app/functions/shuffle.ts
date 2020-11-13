export function shuffle(arr: number[]) {
    let collection = arr,
        len = arr.length,
        rng = Math.random,
        random,
        temp;

    while (len) {
        random = Math.floor(rng() * len);
        len -= 1;
        temp = collection[len];
        collection[len] = collection[random];
        collection[random] = temp;
    }

    return collection;
}
