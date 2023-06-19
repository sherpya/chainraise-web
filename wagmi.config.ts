import { defineConfig } from '@wagmi/cli';
import { hardhat } from '@wagmi/cli/plugins';

export default defineConfig({
    out: 'gen/abi.ts',
    plugins: [
        hardhat({
            project: '../chainraise'
        }),
    ]
});
