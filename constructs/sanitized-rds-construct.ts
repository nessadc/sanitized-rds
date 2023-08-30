import {
  aws_rds as rds,
  aws_ec2 as ec2,
  aws_stepfunctions as stepfunctions,
  aws_stepfunctions_tasks as stepfunctions_tasks,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WaitFunction } from './wait-lambda';

export interface SanitizedRdsProps {
  dbClusterName?: string;
  vpc?: ec2.Vpc;
}

export class SanitizedRds extends Construct {
  private readonly databaseIdentifier: string;
  public snapshotter: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: SanitizedRdsProps = {}) {
    super(scope, id);

    const db = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.LARGE
        ),
      }),
      vpc: props.vpc ? props.vpc : new ec2.Vpc(this, 'Vpc'),
    });

    const waitState = new stepfunctions.Wait(this, 'Wait 10 seconds', {
      time: stepfunctions.WaitTime.duration(Duration.seconds(10)),
    });

    let c: stepfunctions.IChainable;
    c = this.createSnapshot(
      'Create Temporary Snapshot',
      db.clusterIdentifier,
      'myTestSnapshot'
    )
      // .next(
      //   new stepfunctions.Choice(this, 'Is snapshot ready?')
      //     .when(
      //       stepfunctions.Condition.booleanEquals('$.isReady', true),
      //       new stepfunctions.Pass(this, 'Snapshot Ready')
      //     )
      //     .otherwise(
      //       waitState.next(
      //         this.checkSnapshotStatus('Waiting for snapshot', 'myTestSnapShot')
      //       )
      //     )
      // )
      // .next(this.checkSnapshotStatus('Wait for snapshot', 'myTestSnapshot'))
      .next(
        this.createTempDatabase(
          'Create Temporary Cluster',
          'aurora-postgresql',
          'myTestSnapshot'
        ).next(
          this.deleteTempSnapshot(
            'Delete Temporary Snapshot',
            'myTestSnapshot'
          ).next(this.deleteTempDatabase('Delete Temporary Database'))
        )
      );

    this.snapshotter = new stepfunctions.StateMachine(this, 'Orchestrator', {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(c),
    });
  }

  private createSnapshot(id: string, databaseId: string, snapshotId: string) {
    return new stepfunctions_tasks.CallAwsService(this, id, {
      service: 'rds',
      action: 'createDBClusterSnapshot',
      parameters: {
        DbClusterIdentifier: databaseId,
        DbClusterSnapshotIdentifier: snapshotId,
      },
      iamResources: ['*'],
      resultPath: stepfunctions.JsonPath.DISCARD,
    });
  }

  private checkSnapshotStatus(id: string, snapshotId: string) {
    return new stepfunctions_tasks.LambdaInvoke(this, id, {
      lambdaFunction: new WaitFunction(this, 'wait'),
      outputPath: '$.Payload',
    });
  }

  private createTempDatabase(id: string, engine: string, snapshotId: string) {
    return new stepfunctions_tasks.CallAwsService(this, id, {
      service: 'rds',
      action: 'restoreDBClusterFromSnapshot',
      parameters: {
        DbClusterIdentifier: 'tempDatabase',
        Engine: engine,
        SnapshotIdentifier: snapshotId,
      },
      iamResources: ['*'],
    });
  }

  // private runFargateTask(id: string, script) {
  //   return new stepfunctions_tasks.CallAwsService(this, id, )
  // }

  private deleteTempSnapshot(id: string, snapshotId: string) {
    return new stepfunctions_tasks.CallAwsService(this, id, {
      service: 'rds',
      action: 'deleteDBClusterSnapshot',
      parameters: {
        DbClusterSnapshotIdentifier: snapshotId,
      },
      iamResources: ['*'],
    });
  }

  private deleteTempDatabase(id: string) {
    return new stepfunctions_tasks.CallAwsService(this, id, {
      service: 'rds',
      action: 'deleteDBCluster',
      parameters: {
        DbClusterIdentifier: 'tempDatabase',
        DeleteAutomatedBackups: true,
        SkipFinalSnapshot: true,
      },
      iamResources: ['*'],
    });
  }
}
