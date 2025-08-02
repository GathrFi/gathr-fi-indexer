import { createConfig } from "ponder";

import { MOCK_USDC_ABI } from "./abis/GathrFiAbi";
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
      address: "0xa3634254AEB3f2fC8e623B6b2fe45053482407De",
      startBlock: 24416281,
    },
    GathrFi: {
      chain: "liskSepolia",
      abi: GATHRFI_ABI,
      address: "0x2b116a94B287aFdc1F8B95e6fcEb734bC6b99C99",
      startBlock: 24416281,
    },
  },
});
