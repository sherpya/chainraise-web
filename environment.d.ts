declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_HARDHAT_USDT_ADDRESS: string;
            NEXT_PUBLIC_HARDHAT_USDC_ADDRESS: string;
            NEXT_PUBLIC_HARDHAT_CHAINRAISE_ADDRESS: string;
        }
    }
}

export { };
