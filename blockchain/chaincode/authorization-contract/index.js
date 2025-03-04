/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const authorizationContract = require('./lib/authorization');

module.exports.AuthorizationContract = authorizationContract;
module.exports.contracts = [authorizationContract];
