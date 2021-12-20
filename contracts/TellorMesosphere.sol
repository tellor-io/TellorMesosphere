// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "usingtellor/contracts/UsingTellor.sol";
import "hardhat/console.sol";

contract TellorMesosphere is UsingTellor {

    constructor(address payable _tellor) UsingTellor(_tellor) {}


    /**
     * @dev Gets median of oracle values within a given time interval
     * @param _queryId is the id of the desired data
     * @param _timestamp is the highest timestamp in the time interval
     * @param _timeLimit is the length (seconds) of the time interval
     * @param _maxValueCount is the maximum number of values used to calculate a median
     * @return uint256 the median value
     * @return uint256 the quantity of values used to determine the median
     */
    function getMedian(bytes32 _queryId, uint256 _timestamp, uint256 _timeLimit, uint256 _maxValueCount) public view returns(uint256, uint256) {
      (bool _found, uint256 _newestIndex) = getIndexForDataBefore(_queryId, _timestamp);
      if(!_found) {
          return (0, 0); // no value found before _timestamp
      }
      uint256 _currentTimestamp = getTimestampbyQueryIdandIndex(_queryId, _newestIndex);
      if(_timestamp - _currentTimestamp > _timeLimit) {
          return (0, 0); // no value found within _timeLimit
      }
      uint256 _oldestIndex;
      (_found, _oldestIndex) = getIndexForDataBefore(_queryId, _timestamp - _timeLimit);
      if(_found) {
        _oldestIndex++;
      }
      if(_newestIndex <= _oldestIndex) {
        return (_sliceUint(retrieveData(_queryId, _currentTimestamp)), 1); // only one valid value
      }
      uint256 _validValuesCount = min(_newestIndex - _oldestIndex + 1, _maxValueCount);
      _oldestIndex = _newestIndex + 1 - _validValuesCount;
      uint256[] memory _validValues = new uint256[](_validValuesCount);
      for(uint256 i=_oldestIndex; i<=_newestIndex; i++) {
        _currentTimestamp = getTimestampbyQueryIdandIndex(_queryId, i);
        _validValues[i-_oldestIndex] = _sliceUint(retrieveData(_queryId, _currentTimestamp));
      }
      // sort _validValues array from least to greatest
      for (uint256 i = 1; i < _validValuesCount; i++) {
          for (uint256 j = i; j > 0 && _validValues[j-1]  > _validValues[j]; j--) {
              uint256 tmp = _validValues[j];
                  _validValues[j] = _validValues[j-1];
                  _validValues[j-1] = tmp;
              }
      }
      // calculate median value
      uint256 _median;
      if (_validValuesCount % 2 == 1) {
          _median = _validValues[_validValuesCount / 2];
      } else {
          _median = (_validValues[_validValuesCount / 2] + (_validValues[_validValuesCount / 2 - 1])) / 2;
      }
      return (_median, _validValuesCount);
    }

    function getMedianNow(bytes32 _queryId, uint256 _timeLimit, uint256 _maxValueCount) public view returns (uint256, uint256) {
        return getMedian(_queryId, block.timestamp, _timeLimit, _maxValueCount);
    }

    function min(uint256 _a, uint256 _b) public pure returns(uint256) {
      if(_a < _b) {
        return _a;
      } else {
        return _b;
      }
    }

    /**
     * @dev Utilized to help slice a bytes variable into a uint
     * @param _b is the bytes variable to be sliced
     * @return _x of the sliced uint256
     */
    function _sliceUint(bytes memory _b) public pure returns (uint256 _x) {
        uint256 _number = 0;
        for (uint256 _i = 0; _i < _b.length; _i++) {
            _number = _number * 2**8;
            _number = _number + uint8(_b[_i]);
        }
        return _number;
    }
}
