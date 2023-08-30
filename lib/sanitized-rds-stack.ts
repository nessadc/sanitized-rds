import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { SanitizedRds } from '../constructs/sanitized-rds-construct';

export class SanitizedRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sanitizer = new SanitizedRds(this, 'SanitizedRds');
  }
}
