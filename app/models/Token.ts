export class Token {
    constructor(public name: string, public address: string, public decimals: number = 18) { }
};

export type TokenMap = {
    [key: string]: Token[];
};
