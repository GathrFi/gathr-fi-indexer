import { createConfig } from "ponder";

import { MOCK_USDC_ABI } from "./abis/GathrFiAbi";
import { MOCK_AAVE_POOL_ABI } from "./abis/GathrFiAbi";
import { GATHRFI_ABI } from "./abis/GathrFiAbi";

export default createConfig({
  chains: {
    liskSepolia: {
      id: 4202,
      rpc: "https://rpc.sepolia-api.lisk.com",
    },
  },
  contracts: {
    MockUSDC: {
      chain: "liskSepolia",
      abi: MOCK_USDC_ABI,
      address: "0x946cE267a0F6045C994Fa6401aD2F5b8B2A51097",
      startBlock: 24181207,
    },
    MockAavePool: {
      chain: "liskSepolia",
      abi: MOCK_AAVE_POOL_ABI,
      address: "0xfA1c92F494A701F7eA99fb3a6Fd10B198dA75bFD",
      startBlock: 24181208,
    },
    GathrFi: {
      chain: "liskSepolia",
      abi: GATHRFI_ABI,
      address: "0x37c5cC6807f554Ad17F7b70e1bBF80905A8C9afE",
      startBlock: 24181208,
    },
  },
});
