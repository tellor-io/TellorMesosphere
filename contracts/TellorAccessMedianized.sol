// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0); // Solidity only automatically asserts when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}


/**
 * @title Select
 * @dev Median Selection Library
 */
library Select {
    using SafeMath for uint256;

    /**
     * @dev Sorts the input array up to the denoted size, and returns the median.
     * @param array Input array to compute its median.
     * @param size Number of elements in array to compute the median for.
     * @return Median of array.
     */
    function computeMedian(uint256[] memory array, uint256 size)
        internal
        pure
        returns (uint256)
    {
        require(size > 0 && array.length >= size);
        for (uint256 i = 1; i < size; i++) {
            for (uint256 j = i; j > 0 && array[j-1]  > array[j]; j--) {
                uint256 tmp = array[j];
                array[j] = array[j-1];
                array[j-1] = tmp;
            }
        }
        if (size % 2 == 1) {
            return array[size / 2];
        } else {
            return array[size / 2].add(array[size / 2 - 1]) / 2;
        }
    }
}

contract TellorAccessMedianized {
    /*Storage*/
    mapping(uint256 => mapping(uint256 => uint256)) public values; //requestId -> timestamp -> value
    mapping(uint256 => uint256[]) public timestamps; //timestamp to array of values
    address[] public reporters;
    mapping(address => uint256) public reporterIndices;
    mapping(uint256 => uint256[]) public latestValues;
    mapping(uint256 => uint256[]) public latestTimestamps;
    mapping(uint256 => uint256) public oldestTimestampFromLatestBlock;
    uint256 public timeLimit;
    uint256 public quorum;
    
    function submitValue(uint256 _requestId, uint256 _value) external {
        // require isReporter
        latestValues[_requestId][reporterIndices[msg.sender]] = _value;
        latestTimestamps[_requestId][reporterIndices[msg.sender]] = block.timestamp;
        
        bool _ifRetrieve;
        uint256 _median;
        uint256 _oldestTimestamp;
        (_ifRetrieve, _median, _oldestTimestamp) = getNewMedian(_requestId);
        
        if(_ifRetrieve) {
            if(_oldestTimestamp == oldestTimestampFromLatestBlock[_requestId]) {
                
            } else {
                uint256 _index = timestamps[_requestId].length;
                values[_requestId][_index] = _median;
                timestamps[_requestId].push(block.timestamp);
                oldestTimestampFromLatestBlock[_requestId] = _oldestTimestamp;
            }
        }
    }
    
    function getNewMedian(uint256 _requestId) public view returns(bool, uint256, uint256) {
        uint256[] memory _validReports;
        uint256 _oldestTimestamp = block.timestamp;
        
        for(uint256 i=0; i<latestValues[_requestId].length; i++) {
            if(latestTimestamps[_requestId][i] > block.timestamp - timeLimit) {
                _validReports[_validReports.length] = latestValues[_requestId][i];
                if(latestTimestamps[_requestId][i] < _oldestTimestamp) {
                    _oldestTimestamp = latestTimestamps[_requestId][i];
                }
            }
        }
        
        if(_validReports.length >= quorum) {
            return(true, Select.computeMedian(_validReports, _validReports.length), _oldestTimestamp);
        } else {
            return(false, 0, 0);
        }
    }

    
    
}
