// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./SafeMath.sol";

contract TellorMesosphere is AccessControl {
    
    using SafeMath for uint256;
    
    /*Storage*/
    mapping(uint256 => mapping(uint256 => uint256)) public values; //requestId -> timestamp -> value
    mapping(uint256 => uint256[]) public timestamps; //timestamp to array of values
    mapping(uint256 => address) public reporters;
    mapping(address => uint256) public reporterIndices;
    mapping(uint256 => mapping(uint256 => uint256)) public latestValues;
    mapping(uint256 => mapping(uint256 => uint256)) public latestTimestamps;
    mapping(uint256 => uint256) public oldestTimestampFromLatestBlock;
    mapping(uint256 => uint256) public numberReportersFromLatestBlock;
    uint256[] public availableReporterIndices;
    uint256 public latestValuesLength;
    uint256 public numberOfReporters;
    uint256 public timeLimit;
    uint256 public maximumDeviation;
    uint256 public quorum;
    bytes32 public constant REPORTER_ROLE = keccak256("reporter");//used in access contract, the role of a given party
    
    constructor(uint256 _quorum, uint256 _timeLimit, uint256 _maximumDeviation) {
        quorum = _quorum;
        timeLimit = _timeLimit;
        maximumDeviation = _maximumDeviation;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(REPORTER_ROLE, DEFAULT_ADMIN_ROLE);
    }
    
    /**
     * @dev Modifier to restrict only to the admin role.
    */
    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Restricted to admins.");
        _;
    }

    /**
     * @dev Restricted to members of the reporter role.
    */
    modifier onlyReporter() {
        require(isReporter(msg.sender), "Restricted to reporters.");
        _;
    }
    
    /**
     * @dev Add an address to the admin role. Restricted to admins.
     * @param _admin_address is the admin address to add 
    */
    function addAdmin(address _admin_address) external virtual onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, _admin_address);
    }

    /**
     * @dev Add an account to the reporter role. Restricted to admins.
     * @param _reporter_address is the address of the reporter to give permissions to submit data
    */
    function addReporter(address _reporter_address) external virtual onlyAdmin {
        require(!isReporter(_reporter_address), "Address already has reporter role");
        uint256 _newReporterIndex;
        if(availableReporterIndices.length > 0) {
            _newReporterIndex = availableReporterIndices[availableReporterIndices.length-1];
            availableReporterIndices.pop();
        } else {
            _newReporterIndex = numberOfReporters + 1;
            latestValuesLength++;
        }
        reporters[_newReporterIndex] = _reporter_address;
        reporterIndices[_reporter_address] = _newReporterIndex;
        numberOfReporters++;
        grantRole(REPORTER_ROLE, _reporter_address);
    }
    
    /**
     * @dev Allows admin to change quorum variable
     * @param _quorum is the new quorum value
     */
    function updateQuorum(uint256 _quorum) external onlyAdmin {
        quorum = _quorum;
    }
    
     /**
     * @dev Allows the user to get the latest value for the requestId specified
     * @param _requestId is the requestId to look up the value for
     * @return ifRetrieve bool true if it is able to retreive a value, the value, and the value's timestamp
     * @return value the value retrieved
     * @return timestampRetrieved the value's timestamp
    */
    function getCurrentValue(uint256 _requestId) public view returns (bool, uint256, uint256) {
        uint256 _count = getNewValueCountbyRequestId(_requestId);
        if(numberReportersFromLatestBlock[_requestId] < numberOfReporters && 
            oldestTimestampFromLatestBlock[_requestId] > block.timestamp - timeLimit) {
            _count--;
        } 
        
        uint256 _time =
            getTimestampbyRequestIDandIndex(_requestId, _count - 1);
        uint256 _value = retrieveData(_requestId, _time);
        if (_value > 0) return (true, _value, _time);
        return (false, 0, _time);
    }
    
    /**
     * @dev Allows the user to get the first value for the requestId before the specified timestamp
     * @param _requestId is the requestId to look up the value for
     * @param _timestamp before which to search for first verified value
     * @return ifRetrieve bool true if it is able to retreive a value, the value, and the value's timestamp
     * @return value the value retrieved
     * @return timestampRetrieved the value's timestamp
    */
    function getDataBefore(uint256 _requestId, uint256 _timestamp) external view returns (bool, uint256, uint256) {
        (bool _found, uint256 _index) =
            _getIndexForDataBefore(_requestId, _timestamp);
        if (!_found) return (false, 0, 0);
        uint256 _time =
            getTimestampbyRequestIDandIndex(_requestId, _index);
        uint256 _value = retrieveData(_requestId, _time);
        //If value is diputed it'll return zero
        if (_value > 0) return (true, _value, _time);
        return (false, 0, 0);
    }

    /** 
     * @dev Remove an account from the reporter role. Restricted to admins.
     * @param _reporter_address is the address of the reporter to remove permissions to submit data
    */
    function removeReporter(address _reporter_address) external virtual onlyAdmin  {
        uint256 _reporterIndex = reporterIndices[_reporter_address];
        reporters[_reporterIndex] = address(0);
        reporterIndices[_reporter_address] = 0;
        availableReporterIndices.push(_reporterIndex);
        numberOfReporters--;
        revokeRole(REPORTER_ROLE, _reporter_address);
    }

    /** 
     * @dev Remove oneself from the admin role.
    */
    function renounceAdmin() external virtual {
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Function for reporters to submit a value
     * @param _requestId The tellorId to associate the value to
     * @param _value the value for the requestId
    */
    function submitValue(uint256 _requestId, uint256 _value) external onlyReporter {
        // require(isReporter(msg.sender), "Sender must be a Reporter to submitValue");
        latestValues[_requestId][reporterIndices[msg.sender]] = _value;
        latestTimestamps[_requestId][reporterIndices[msg.sender]] = block.timestamp;

        (bool _ifRetrieve, uint256 _median, uint256 _oldestTimestamp, uint256 _numberOfValidReports) = getNewMedian(_requestId);
        
        // Check whether nReporters of latest blockMedian >= min(5, totalReporters)
        // if TRUE, create new block
        if(_ifRetrieve) {
            uint256 _index;
            if(_oldestTimestamp == oldestTimestampFromLatestBlock[_requestId]) {
                _index = timestamps[_requestId].length - 1;
                uint256 _previousTimestamp = timestamps[_requestId][_index];
                values[_requestId][_previousTimestamp] = 0;
                timestamps[_requestId][_index] = block.timestamp;
            } else {
                _index = timestamps[_requestId].length;
                timestamps[_requestId].push(block.timestamp);
                oldestTimestampFromLatestBlock[_requestId] = _oldestTimestamp;
            }
            values[_requestId][block.timestamp] = _median;
            numberReportersFromLatestBlock[_requestId] = _numberOfValidReports;
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
     * @dev Return `true` if the account belongs to the admin role.
     * @param _admin_address is the admin address to check if they have an admin role
     * @return true if the address has an admin role
     */
    function isAdmin(address _admin_address) public virtual view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _admin_address);
    }

    /**
     * @dev Return `true` if the account belongs to the reporter role.
     * @param _reporter_address is the address to check if they have a reporter role
     */
    function isReporter(address _reporter_address) public virtual view returns (bool)  {
        return hasRole(REPORTER_ROLE, _reporter_address);
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
    
    /**
     * @dev Allows the user to get the index for the requestId for the specified timestamp
     * @param _requestId is the requestId to look up the index based on the _timestamp provided
     * @param _timestamp before which to search for the index
     * @return found true for index found
     * @return index of the timestamp
     */
    function _getIndexForDataBefore(uint256 _requestId, uint256 _timestamp) internal view returns (bool, uint256) {
        uint256 _count = getNewValueCountbyRequestId(_requestId);
        if (_count > 0) {
            uint256 middle;
            uint256 start = 0;
            uint256 end = _count - 1;
            uint256 _time;
            //Checking Boundaries to short-circuit the algorithm
            _time = getTimestampbyRequestIDandIndex(_requestId, start);
            if (_time >= _timestamp) return (false, 0);
            _time = getTimestampbyRequestIDandIndex(_requestId, end);
            if (_time < _timestamp) return (true, end);
            //Since the value is within our boundaries, do a binary search
            while (true) {
                middle = (end - start) / 2 + 1 + start;
                _time = getTimestampbyRequestIDandIndex(
                    _requestId,
                    middle
                );
                if (_time < _timestamp) {
                    //get next value
                    uint256 _nextTime =
                        getTimestampbyRequestIDandIndex(
                            _requestId,
                            middle + 1
                        );
                    if (_nextTime >= _timestamp) {
                        //_time is correct
                        return (true, middle);
                    } else {
                        //look from middle + 1(next value) to end
                        start = middle + 1;
                    }
                } else {
                    uint256 _prevTime =
                        getTimestampbyRequestIDandIndex(
                            _requestId,
                            middle - 1
                        );
                    if (_prevTime < _timestamp) {
                        // _prevtime is correct
                        return (true, middle - 1);
                    } else {
                        //look from start to middle -1(prev value)
                        end = middle - 1;
                    }
                }
            }
        }
        return (false, 0);
    }
    
    /**
     * @dev Calculates new median if enough values have been submitted within timeLimit to reach quorum and 
     * @param _requestId is the requestId to calculate the median for
     * @return bool true if a new valid median could be calculated
     * @return uint256 the newly calculated median value
     * @return uint256 the timestamp of the oldest value used to calculate this new median
     * @return uint256 the quantity of valid reports used to calculate this new median
     */
    function getNewMedian(uint256 _requestId) internal returns(bool, uint256, uint256, uint256) {
        uint256[] memory _validReports = new uint256[](numberOfReporters);
        uint256[] memory _validReportIndices = new uint256[](numberOfReporters);
        uint256 _numberOfValidReports;
        uint256 _oldestTimestamp = block.timestamp;
        
        for(uint256 k=1; k<=latestValuesLength; k++) {
            if(latestTimestamps[_requestId][k] > block.timestamp - timeLimit) {
                _validReports[_numberOfValidReports] = latestValues[_requestId][k];
                _validReportIndices[_numberOfValidReports] = k;
                _numberOfValidReports++;
                if(latestTimestamps[_requestId][k] < _oldestTimestamp) {
                    _oldestTimestamp = latestTimestamps[_requestId][k];
                }
            }
        }
        if(_numberOfValidReports < quorum) {
            return(false, 0, 0, _numberOfValidReports);
        } else {
            for (uint256 i = 1; i < _numberOfValidReports; i++) {
                for (uint256 j = i; j > 0 && _validReports[j-1]  > _validReports[j]; j--) {
                    uint256 tmp = _validReports[j];
                    uint256 tmpIndices = _validReportIndices[j];
                    _validReports[j] = _validReports[j-1];
                    _validReportIndices[j] = _validReportIndices[j-1];
                    _validReports[j-1] = tmp;
                    _validReportIndices[j-1] = tmpIndices;
                }
            }
            (,uint256 _lastValue,) = getCurrentValue(_requestId);
            if(_lastValue > 0) {
                if ((_validReports[_numberOfValidReports-1] - _validReports[0]) * 10000 / _lastValue > maximumDeviation) {
                    if (_numberOfValidReports-1 >= quorum) {
                        if(max(_validReports[_numberOfValidReports-1], _lastValue) - min(_validReports[_numberOfValidReports-1], _lastValue) >
                            max(_validReports[0], _lastValue) - min(_validReports[0], _lastValue)) {
                            latestTimestamps[_requestId][_validReportIndices[_numberOfValidReports-1]] = 0;
                        } else {
                            latestTimestamps[_requestId][_validReportIndices[0]] = 0;
                        }
                        return(getNewMedian(_requestId));
                    } else {
                        return(false, 0, 0, _numberOfValidReports);
                    }
                    
                }
            }
            uint256 _median;
            if (_numberOfValidReports % 2 == 1) {
                 _median = _validReports[_numberOfValidReports / 2];
            } else {
                _median = _validReports[_numberOfValidReports / 2].add(_validReports[_numberOfValidReports / 2 - 1]) / 2;
            }
            return(true, _median, _oldestTimestamp, _numberOfValidReports);
        }
    }
    
    function max(uint256 _a, uint256 _b) public pure returns(uint256) {
        if(_a > _b) {
            return(_a);
        } else {
            return(_b);
        }
    }
    
    function min(uint256 _a, uint256 _b) public pure returns(uint256) {
        if(_a < _b) {
            return(_a);
        } else {
            return(_b);
        }
    }
}
