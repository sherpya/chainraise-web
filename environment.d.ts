declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_ALCHEMY_APIKEY: string;
            NEXT_PUBLIC_CHAINRAISE_ADDRESS: string;

            NEXT_PUBLIC_HARDHAT_USDT_ADDRESS: string;
            NEXT_PUBLIC_HARDHAT_USDC_ADDRESS: string;

            NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS: string;
            NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS: string;

            NEXT_PUBLIC_BUILDBEAR_CHAINID: string;
            NEXT_PUBLIC_BUILDBEAR_CONTAINER_NAME: string;
        }
    }
}

export { };
