import { Address } from 'abitype';

export class Token {
    constructor(public name: string, public address: Address, public decimals: number = 18) { }

    static fromEnv(value: string): Token {
        const [address, name] = value.split('=', 1).map((v: string) => v.trim());
        return new Token(name, address as Address);
    }
};

export type TokenMap = {
    [key: string]: Token[];
};
