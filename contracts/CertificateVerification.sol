// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerification {
    struct Certificate {
        bytes32 certHash;
        string studentName;
        string course;
        string institution;
        string issueDate;
    }

    mapping(bytes32 => Certificate) public certificates;

    function addCertificate(
        bytes32 certHash,
        string memory studentName,
        string memory course,
        string memory institution,
        string memory issueDate
    ) public {
        certificates[certHash] = Certificate(certHash, studentName, course, institution, issueDate);
    }

    function verifyCertificate(bytes32 certHash) public view returns (bool) {
        return bytes(certificates[certHash].studentName).length > 0;
    }
}