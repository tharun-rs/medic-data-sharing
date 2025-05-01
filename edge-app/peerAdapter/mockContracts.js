// const { getAuthorizationCollection, getDataCollection, getPHICollection, getPIICollection } = require('../database/models');

// async function uploadAuthorization(fileId, patientId, fileHash, orgName, nodeMultiAddr, readAccess, writeAccess, anonymousPHIAccess) {
//     const AuthorizationCollection = getAuthorizationCollection();
//     try {
//         const authorizationRecord = {
//             fileId,
//             patientId,
//             fileHash,
//             orgName,
//             nodeMultiAddr,
//             readAccess,
//             writeAccess,
//             anonymousPHIAccess,
//             createdAt: new Date()
//         };
//         await AuthorizationCollection.insertOne(authorizationRecord);
//         console.log('Authorization record successfully stored.');
//     } catch (error) {
//         console.error('Error storing authorization record:', error);
//         throw error;
//     }
// }

// async function uploadPIIRecord(patientId, fileId, orgName, nodeMultiAddr, fileHash) {
//     const PIICollection = getPIICollection();
//     try {
//         const piiRecord = {
//             patientId,
//             fileId,
//             orgName,
//             nodeMultiAddr,
//             fileHash,
//             createdAt: new Date()
//         };
//         await PIICollection.insertOne(piiRecord);
//         console.log('PII record successfully stored.');
//         return piiRecord;
//     } catch (error) {
//         console.error('Error storing PII record:', error);
//         throw error;
//     }
// }

// async function uploadPHIRecord(patientId, fileId, orgName, nodeMultiAddr, fileType, fileTag, fileHash) {
//     const PHICollection = getPHICollection();
//     try {
//         const phiRecord = {
//             patientId,
//             fileId,
//             orgName,
//             nodeMultiAddr,
//             fileType,
//             fileTag,
//             fileHash,
//             createdAt: new Date()
//         };
//         await PHICollection.insertOne(phiRecord);
//         console.log('PHI record successfully stored.');
//         return phiRecord;
//     } catch (error) {
//         console.error('Error storing PHI record:', error);
//         throw error;
//     }
// }

// async function getAllPHIByPatientID(patientId) {
//     const PHICollection = getPHICollection();
//     try {
//         const phiRecords = await PHICollection.find({ patientId }).toArray();
//         console.log('PHI records successfully retrieved.');
//         return phiRecords;
//     } catch (error) {
//         console.error('Error retrieving PHI records:', error);
//         throw error;
//     }
// }

// async function getAllPIIByPatientID(patientId) {
//     const PIICollection = getPIICollection();
//     try {
//         const piiRecords = await PIICollection.find({ patientId }).toArray();
//         console.log('PII records successfully retrieved.');
//         return piiRecords;
//     } catch (error) {
//         console.error('Error retrieving PII records:', error);
//         throw error;
//     }
// }

// async function queryAuthorizationForPatient(patientId, requestor) {
//     const AuthorizationCollection = getAuthorizationCollection();
//     try {
//         const query = {
//             patientId,
//             $or: [
//                 { orgName: requestor },
//             ]
//         };
//         const authorizationRecords = await AuthorizationCollection.find(query).toArray();
//         console.log('Authorization records successfully retrieved.');
//         return authorizationRecords;
//     } catch (error) {
//         console.error('Error querying authorization records:', error);
//         throw error;
//     }
// }

// module.exports = {
//     uploadAuthorization,
//     uploadPIIRecord,
//     uploadPHIRecord,
//     getAllPHIByPatientID,
//     getAllPIIByPatientID,
//     queryAuthorizationForPatient
// };