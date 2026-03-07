// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Attendance {

    address public admin;

    struct AttendanceRecord {
        string studentID;
        uint timestamp;
        uint blockNumber;
        address markedBy;
    }

    AttendanceRecord[] public records;

    mapping(address => bool) public teachers;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyTeacher() {
        require(teachers[msg.sender], "Only teacher allowed");
        _;
    }

    function registerTeacher(address _teacher) public onlyAdmin {
        teachers[_teacher] = true;
    }

    function markAttendance(string memory _studentID) public onlyTeacher {

        records.push(
            AttendanceRecord({
                studentID: _studentID,
                timestamp: block.timestamp,
                blockNumber: block.number,
                markedBy: msg.sender
            })
        );
    }

    function getAttendance() public view returns (AttendanceRecord[] memory) {
        return records;
    }
}