const { ContractFactory } = require("ethers");
const { linkLibraries } = require("../util/linkLibraries");
const { asciiStringToBytes32 } = require("../util/asciiStringToBytes32");
const fs = require("fs");

const WETH9 = require("../util/WETH9.json");

// put address of the owner that will be on the 2 factories
let newOwner = "0x11bd2009bC0c230DDc51d3493CFe3Fa484f6240d";
const nativeCurrencyLabelBytes = asciiStringToBytes32("ETH");
const chain = "sepolia";

const hre = require("hardhat");

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  UniswapV2Factory: require("@uniswap/v2-core/build/UniswapV2Factory.json"),
  UniswapV3Staker: require("@uniswap/v3-staker/artifacts/contracts/UniswapV3Staker.sol/UniswapV3Staker.json"),
  UniswapInterfaceMulticall: require("@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json"),
  Migrator: require("@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json"),
  TickLens: require("@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json"),
  QuoterV2: require("@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json"),
  SwapRouter: require("@uniswap/swap-router-contracts/artifacts/contracts/SwapROuter02.sol/SwapROuter02.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  WETH9,
};

const deployContract = async (abi, bytecode, deployParams, actor) => {
  const factory = new ContractFactory(abi, bytecode, actor);
  return await factory.deploy(...deployParams);
};

const deployWETH9 = async (actor) => {
  if (chain == "sepolia") {
    return { target: "0xD0dF82dE051244f04BfF3A8bB1f62E1cD39eED92" };
  }
  if (chain == "mainnet") {
    return { target: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" };
  }
  return await deployContract(
    artifacts.WETH9.abi,
    artifacts.WETH9.bytecode,
    [],
    actor
  );
};

const deployFactoryV3 = async (actor) => {
  return await deployContract(
    artifacts.UniswapV3Factory.abi,
    artifacts.UniswapV3Factory.bytecode,
    [],
    actor
  );
};

const deployFactoryV2 = async (actor, owner) => {
  return await deployContract(
    artifacts.UniswapV2Factory.abi,
    artifacts.UniswapV2Factory.bytecode,
    [owner],
    actor
  );
};

const deployMulticall = async (actor) => {
  if (chain == "mainnet") {
    return { target: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696" };
  }
  return await deployContract(
    artifacts.UniswapInterfaceMulticall.abi,
    artifacts.UniswapInterfaceMulticall.bytecode,
    [],
    actor
  );
};

const deployTickLens = async (actor) => {
  if (chain == "mainnet") {
    return { target: "0xbfd8137f7d1516D3ea5cA83523914859ec47F573" };
  }
  return await deployContract(
    artifacts.TickLens.abi,
    artifacts.TickLens.bytecode,
    [],
    actor
  );
};

const deployNFTDescriptorLibrary = async (actor) => {
  if (chain == "mainnet") {
    return { target: "0x42B24A95702b9986e82d421cC3568932790A48Ec" };
  }
  return await deployContract(
    artifacts.NFTDescriptor.abi,
    artifacts.NFTDescriptor.bytecode,
    [],
    actor
  );
};

const deployPositionDescriptor = async (
  actor,
  nftDescriptorLibraryAddress,
  weth9Address
) => {
  const linkedBytecode = linkLibraries(
    {
      bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        "NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDescriptorLibraryAddress,
    }
  );

  return await deployContract(
    artifacts.NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    [weth9Address, nativeCurrencyLabelBytes],
    actor
  );
};

const deployNonfungiblePositionManager = async (
  actor,
  factoryAddress,
  weth9Address,
  positionDescriptorAddress
) => {
  return await deployContract(
    artifacts.NonfungiblePositionManager.abi,
    artifacts.NonfungiblePositionManager.bytecode,
    [factoryAddress, weth9Address, positionDescriptorAddress],
    actor
  );
};

const deployMigrator = async (actor, factory, weth9, positionManager) => {
  return await deployContract(
    artifacts.Migrator.abi,
    artifacts.Migrator.bytecode,
    [factory, weth9, positionManager],
    actor
  );
};

const deployStaker = async (actor, factory, positionManager) => {
  return await deployContract(
    artifacts.UniswapV3Staker.abi,
    artifacts.UniswapV3Staker.bytecode,
    [factory, positionManager, 2592000, 1892160000], // MAX_INCENTIVE_START_LEAD_TIME = 2592000(1 month)    MAX_INCENTIVE_DURATION = 1892160000(2 years)
    actor
  );
};

const deployQuoter = async (actor, factory, weth9) => {
  return await deployContract(
    artifacts.QuoterV2.abi,
    artifacts.QuoterV2.bytecode,
    [factory, weth9],
    actor
  );
};

const deployRouter = async (
  actor,
  factoryV2,
  factoryV3,
  positionManager,
  weth9Address
) => {
  return await deployContract(
    artifacts.SwapRouter.abi,
    artifacts.SwapRouter.bytecode,
    [factoryV2, factoryV3, positionManager, weth9Address],
    actor
  );
};

async function main() {
  const [actor] = await ethers.getSigners();

  let owner = await actor.address;
  if (newOwner != undefined) owner = newOwner;

  const weth9 = await deployWETH9(actor);
  const factoryV3 = await deployFactoryV3(actor);
  const factoryV2 = await deployFactoryV2(actor, owner);
  const multicall = await deployMulticall(actor);
  const tickLens = await deployTickLens(actor);
  const nftDescriptorLibrary = await deployNFTDescriptorLibrary(actor);

  const positionDescriptor = await deployPositionDescriptor(
    actor,
    nftDescriptorLibrary.target,
    weth9.target
  );
  const positionManager = await deployNonfungiblePositionManager(
    actor,
    factoryV3.target,
    weth9.target,
    positionDescriptor.target
  );
  const migrator = await deployMigrator(
    actor,
    factoryV3.target,
    weth9.target,
    positionManager.target
  );

  if (newOwner != undefined) {
    await factoryV3.setOwner(newOwner);
  }

  const staker = await deployStaker(
    actor,
    factoryV3.target,
    positionManager.target
  );

  const quoterV2 = await deployQuoter(actor, factoryV3.target, weth9.target);

  const router = await deployRouter(
    actor,
    factoryV2.target,
    factoryV3.target,
    positionManager.target,
    weth9.target
  );

  let data = JSON.stringify({
    weth: weth9.target,
    factoryV3: factoryV3.target,
    factoryV2: factoryV2.target,
    multicall: multicall.target,
    tickLens: tickLens.target,
    nftDescriptorLibrary: nftDescriptorLibrary.target,
    positionDescriptor: positionDescriptor.target,
    positionManager: positionManager.target,
    migrator: migrator.target,
    staker: staker.target,
    quoterV2: quoterV2.target,
    router: router.target,
  });
  fs.writeFileSync("constant.json", data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
