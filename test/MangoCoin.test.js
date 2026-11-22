import { expect } from "chai";
import { ethers } from "hardhat";

describe("MangoCoin", function () {
  async function deploy(initialHolderIndex = 0) {
    const signers = await ethers.getSigners();
    const initialHolder = signers[initialHolderIndex];
    const Token = await ethers.getContractFactory("MangoCoin");
    const token = await Token.deploy(initialHolder.address);
    await token.waitForDeployment();
    return { token, signers, initialHolder };
  }

  it("sets the expected ERC-20 metadata", async function () {
    const { token } = await deploy();
    expect(await token.name()).to.equal("MANGO Coin");
    expect(await token.symbol()).to.equal("MANGO");
    expect(await token.decimals()).to.equal(18n);
  });

  it("mints exactly 100,000,000 MANGO once to the explicit initial holder", async function () {
    const { token, initialHolder } = await deploy(1);
    const cap = 100_000_000n * 10n ** 18n;
    expect(await token.MAX_SUPPLY()).to.equal(cap);
    expect(await token.totalSupply()).to.equal(cap);
    expect(await token.balanceOf(initialHolder.address)).to.equal(cap);
  });

  it("supports ordinary ERC-20 transfers without changing total supply", async function () {
    const { token, signers, initialHolder } = await deploy();
    const recipient = signers[1];
    const amount = 125n * 10n ** 18n;
    await expect(token.connect(initialHolder).transfer(recipient.address, amount))
      .to.changeTokenBalances(token, [initialHolder, recipient], [-amount, amount]);
    expect(await token.totalSupply()).to.equal(await token.MAX_SUPPLY());
  });

  it("rejects the zero address as initial holder", async function () {
    const Token = await ethers.getContractFactory("MangoCoin");
    await expect(Token.deploy(ethers.ZeroAddress))
      .to.be.revertedWith("MangoCoin: zero initial holder");
  });

  it("does not expose owner or public mint functions", async function () {
    const { token } = await deploy();
    expect(token.interface.hasFunction("owner")).to.equal(false);
    expect(token.interface.hasFunction("mint")).to.equal(false);
  });
});
