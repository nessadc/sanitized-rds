import { aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from 'path';

export class WaitFunction extends lambda.Function {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      runtime: new lambda.Runtime('nodejs16.x', lambda.RuntimeFamily.NODEJS),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'wait'))
    })
  }
}
