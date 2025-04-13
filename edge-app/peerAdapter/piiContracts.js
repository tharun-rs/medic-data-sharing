// const connectToNetwork = require('./connect');

// async function createPIIAccessRequestWithFileID(patient_id, file_id, data_custodian, requestor, requestor_address){
//     try {
//         console.log("file: ",file_id);
//         const { gateway, contract } = await connectToNetwork('pii');
//         const result = await contract.submitTransaction(
//             'createAccessRequestWithFileID',
//             patient_id,
//             file_id,
//             data_custodian,
//             requestor,
//             requestor_address,
//             new Date().toISOString(),
//         );
//         gateway.disconnect();
//         return result.toString();
//     } catch (error) {
//         throw error;
//     }
// }

// async function queryPIIAccessRequestsByFileID(fileId){
//     try {
//         const { gateway, contract } = await connectToNetwork('pii');
//         const result = await contract.evaluateTransaction('queryAccessRequestsByFileID', fileId);
//         gateway.disconnect();
//         return JSON.parse(result.toString());
//     } catch (error) {
//         throw error;
//     }
// }

// module.exports = {
//     createPIIAccessRequestWithFileID,
//     queryPIIAccessRequestsByFileID
// }