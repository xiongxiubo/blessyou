import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { type AppKitNetwork, bsc } from "@reown/appkit/networks";

export const projectId = "b56e18d47c72ab683b10814fe9495694"; // this is a public projectId only to use on localhost

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc];

export const ethersAdapter = new EthersAdapter();
