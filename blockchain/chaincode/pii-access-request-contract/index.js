/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const piiAccessContract = require('./lib/PIIaccess');

module.exports.PIIAccessContract = piiAccessContract;
module.exports.contracts = [piiAccessContract];
