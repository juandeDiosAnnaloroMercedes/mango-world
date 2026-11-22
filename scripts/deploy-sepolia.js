import { ethers, network } from "hardhat";

const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  if (network.name !== "sepolia" || Number(network.config.chainId) !== 11155111) {
    throw new Error("Safety stop: this script only permits Ethereum Sepolia.");
  }
  const initialHolder = process.env.INITIAL_HOLDER;
  if (!initialHolder || !ethers.isAddress(initialHolder) || initialHolder === ZERO) {
    throw new Error("Set INITIAL_HOLDER to the explicitly approved recipient address.");
  }
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Missing deployer. Configure DEPLOYER_PRIVATE_KEY locally.");

  console.log("Network: Sepolia (testnet)");
  console.log("Deployer:", deployer.address);
  console.log("Initial supply recipient:", initialHolder);
  const Token = await ethers.getContractFactory("MangoCoin");
  const token = await Token.deploy(initialHolder);
  await token.waitForDeployment();
  console.log("MangoCoin address:", await token.getAddress());
  console.log("Deployment tx:", token.deploymentTransaction()?.hash);
  console.log("Supply:", ethers.formatUnits(await token.totalSupply(), 18), "MANGO");
  console.log("No Mainnet deployment is possible through this script.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
