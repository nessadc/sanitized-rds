const AWS = require('aws-sdk');
const rds = new AWS.RDS();

exports.handler = async (event: any) => {
  const snapshots = await rds
    .describeDBSnapshots({ DBSnapshotIdentifier: 'myTestSnapshot' })
    .promise();

  if (
    snapshots.DBSnapshots &&
    snapshots.DBSnapshots[0].Status === 'available'
  ) {
    return { isReady: true };
  } else {
    return { isReady: false };
  }
};
