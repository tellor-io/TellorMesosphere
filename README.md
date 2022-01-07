<p align="center">
  <a href='https://www.tellor.io/'>
    <img src= 'https://raw.githubusercontent.com/tellor-io/TellorBrandMaterials/master/Swoosh%20and%20wordmark%20new/SwooshWordmark_Horizontal_Grey.png' height="200" alt='tellor.io' />
  </a>
</p>

<p align="center">
  <a href='https://twitter.com/WeAreTellor'>
    <img src= 'https://img.shields.io/twitter/url/http/shields.io.svg?style=social' alt='Twitter WeAreTellor' />
  </a>
</p>

## Overview <a name="overview"> </a>  

<b>TellorMesosphere</b> is a medianizer (mesosphere means "middle earth") for layer 2 applications using Tellor. Works in tandem with [TellorFlex](https://github.com/tellor-io/tellorFlex).

## How does it work

The Mesosphere is a contract with a single getter function:
```solidity
/**
 * @dev Gets median of oracle values within a given time interval
 * @param _queryId is the id of the desired data
 * @param _timestamp is the highest timestamp in the time interval
 * @param _timeLimit is the length (seconds) of the time interval
 * @param _maxValueCount is the max number of values used to calculate a median
 * @return uint256 the median value
 * @return uint256 the quantity of values used to determine the median
 */
function getMedian(
    bytes32 _queryId,
    uint256 _timestamp,
    uint256 _timeLimit,
    uint256 _maxValueCount
) public view returns (uint256, uint256);
```
The `getMedian` function will start looking for data reported at `_timestamp`, moving back in time until either `_maxValueCount` values are found or the `_timeLimit` is reached. The function will then return two `uint256` values: the median value and the number of values used to find the median.

Tellor oracle data is stored in `bytes` form, which can represent a single integer value, multiple integer values, or even a mix of integers, strings, and bytes. Each oracle data feed has a unique identifier, known as the `queryId`. The Mesosphere only works with queryIds whose bytes data represents a single integer.


## Setting up and testing

Install Dependencies
```
npm i
```
Compile Smart Contracts
```
npx hardhat compile
```

Test Locally
```
npx hardhat test
```

## Maintainers <a name="maintainers"> </a>
This repository is maintained by the [Tellor team](https://github.com/orgs/tellor-io/people)


## How to Contribute<a name="how2contribute"> </a>  
Join our Discord or Telegram:
[<img src="./public/telegram.png" width="24" height="24">](https://t.me/tellor)
[<img src="./public/discord.png" width="24" height="24">](https://discord.gg/g99vE5Hb)

Check out our issues log here on Github or feel free to reach out anytime [info@tellor.io](mailto:info@tellor.io)

## Copyright

Tellor Inc. 2022
