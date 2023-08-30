# sanitized-rds 
Use a state machine that does the following:
- gets the latest snapshot of a specified RDS cluster
- creates a temp cluster from it
- runs the sanitizer script 
- shares it with whichever accounts
- deletes temporary database and snapshot

Then the dev account has another step machine that will:
- grab the latest sanitized prod snapshot
- create a new dev cluster 
- modify DNS Records to point to new rds cluster
- delete old dev cluster

Both of these state machines will be ran at night periodically via Event timers.
There will also exist a Lambda that can trigger this entire workflow.
