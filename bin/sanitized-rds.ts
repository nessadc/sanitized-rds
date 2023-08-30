#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SanitizedRdsStack } from '../lib/sanitized-rds-stack';

const app = new cdk.App();
new SanitizedRdsStack(app, 'SanitizedRdsStack', {});
