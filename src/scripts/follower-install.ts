import { downloadFollower, followerDaemon, followerKill } from '../main/follower';

async function main() {
  await downloadFollower();
  await followerDaemon();
}

process.on('beforeExit', followerKill);
main();
