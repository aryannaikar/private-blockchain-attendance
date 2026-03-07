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

    // teacher wallets
    mapping(address => bool) public teachers;

    // student wallet -> roll number
    mapping(address => string) public studentIDs;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    // register teacher wallet
    function registerTeacher(address _teacher) public onlyAdmin {
        teachers[_teacher] = true;
    }

    // register student wallet with roll number
    function registerStudent(address _student, string memory _studentID) public onlyAdmin {
        studentIDs[_student] = _studentID;
    }

    function markAttendance(string memory _studentID) public {

        // Teacher can mark anyone
        if (teachers[msg.sender]) {

            records.push(
                AttendanceRecord({
                    studentID: _studentID,
                    timestamp: block.timestamp,
                    blockNumber: block.number,
                    markedBy: msg.sender
                })
            );

        } 
        else {

            // Student can only mark their own ID
            require(
                keccak256(bytes(studentIDs[msg.sender])) == keccak256(bytes(_studentID)),
                "Students can mark only their own attendance"
            );

            records.push(
                AttendanceRecord({
                    studentID: _studentID,
                    timestamp: block.timestamp,
                    blockNumber: block.number,
                    markedBy: msg.sender
                })
            );
        }
    }

    function getAttendance() public view returns (AttendanceRecord[] memory) {
        return records;
    }
}