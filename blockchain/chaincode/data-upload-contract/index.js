/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const dataUploadContract = require('./lib/dataupload');

module.exports.DataUploadContract = dataUploadContract;
module.exports.contracts = [dataUploadContract];
