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
    uint256[] public availableReporterIndices;
    mapping(address => uint256) public reporterIndices;
    mapping(uint256 => uint256[]) public latestValues;
    mapping(uint256 => uint256[]) public latestTimestamps;
    mapping(uint256 => uint256) public oldestTimestampFromLatestBlock;
    mapping(uint256 => uint256) public numberReportersFromLatestBlock;
    uint256 public numberOfReporters;
    uint256 public timeLimit;
    uint256 public quorum;
    
    constructor(uint256 _quorum, uint256 _timeLimit) {}
    
    function addReporter(address _reporter) external {
        uint256 _newReporterIndex;
        if(availableReporterIndices.length > 0) {
            _newReporterIndex = availableReporterIndices[availableReporterIndices.length-1];
            availableReporterIndices.pop();
        } else {
            _newReporterIndex = numberOfReporters + 1;
        }
        reporters[_newReporterIndex] = _reporter;
        reporterIndices[_reporter] = _newReporterIndex;
        numberOfReporters++;
    }
    
    function getCurrentValue(uint256 _requestId) external view returns (bool, uint256, uint256) {
        uint256 _count = getNewValueCountbyRequestId(_requestId);
        if(numberReportersFromLatestBlock[_requestId] < numberOfReporters || 
            oldestTimestampFromLatestBlock[_requestId] > block.timestamp - timeLimit) {
            _count--;
        } 
        
        uint256 _time =
            getTimestampbyRequestIDandIndex(_requestId, _count - 1);
        uint256 _value = retrieveData(_requestId, _time);
        if (_value > 0) return (true, _value, _time);
        return (false, 0, _time);
    }
    
    function submitValue(uint256 _requestId, uint256 _value) external {
        // require isReporter
        latestValues[_requestId][reporterIndices[msg.sender]] = _value;
        latestTimestamps[_requestId][reporterIndices[msg.sender]] = block.timestamp;

        (bool _ifRetrieve, uint256 _median, uint256 _oldestTimestamp) = getNewMedian(_requestId);
        
        // Check whether nReporters of latest blockMedian >= min(5, totalReporters)
        // if TRUE, create new block
        if(_ifRetrieve) {
            uint256 _index;
            if(_oldestTimestamp == oldestTimestampFromLatestBlock[_requestId]) {
                _index = timestamps[_requestId].length - 1;
            } else {
                _index = timestamps[_requestId].length;
                oldestTimestampFromLatestBlock[_requestId] = _oldestTimestamp;
            }
            values[_requestId][_index] = _median;
            timestamps[_requestId][_index] = (block.timestamp);
        }
    }
    
    /**
     * @dev Counts the number of values that have been submited for the request
     * @param _requestId the requestId to look up
     * @return uint count of the number of values received for the requestId
    */
    function getNewValueCountbyRequestId(uint256 _requestId) public view returns(uint) {
        return timestamps[_requestId].length;
    }
    
    /**
     * @dev Gets the timestamp for the value based on their index
     * @param _requestId is the requestId to look up
     * @param _index is the value index to look up
     * @return uint timestamp
    */
    function getTimestampbyRequestIDandIndex(uint256 _requestId, uint256 _index) public view returns(uint256) {
        uint len = timestamps[_requestId].length;
        if(len == 0 || len <= _index) return 0; 
        return timestamps[_requestId][_index];
    }
    
    /** 
     * @dev Remove an account from the reporter role. Restricted to admins.
     * @param _reporter_address is the address of the reporter to remove permissions to submit data
    */
    function removeReporter(address _reporter_address) external {
        uint256 _reporterIndex = reporterIndices[_reporter_address];
        reporters[_reporterIndex] = address(0);
        reporterIndices[_reporter_address] = 0;
        availableReporterIndices.push(_reporterIndex);
        numberOfReporters--;
    }
    
    /**
     * @dev Retrieve value from oracle based on requestId/timestamp
     * @param _requestId being requested
     * @param _timestamp to retrieve data/value from
     * @return uint value for requestId/timestamp submitted
    */
    function retrieveData(uint256 _requestId, uint256 _timestamp) public view returns(uint256){
        return values[_requestId][_timestamp];
    }
    
    function getNewMedian(uint256 _requestId) public view returns(bool, uint256, uint256) {
        uint256[] memory _validReports = new uint256[](numberOfReporters);
        uint256 _numberOfValidReports;
        uint256 _oldestTimestamp = block.timestamp;
        
        for(uint256 i=1; i<=latestValues[_requestId].length; i++) {
            if(latestTimestamps[_requestId][i] > block.timestamp - timeLimit) {
                _validReports[_numberOfValidReports] = latestValues[_requestId][i];
                _numberOfValidReports++;
                if(latestTimestamps[_requestId][i] < _oldestTimestamp) {
                    _oldestTimestamp = latestTimestamps[_requestId][i];
                }
            }
        }
        
        if(_numberOfValidReports >= quorum) {
            return(true, Select.computeMedian(_validReports, _numberOfValidReports), _oldestTimestamp);
        } else {
            return(false, 0, 0);
        }
    }

    
    
}
