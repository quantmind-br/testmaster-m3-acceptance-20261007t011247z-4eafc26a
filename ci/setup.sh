#!/usr/bin/env bash
# Declared TestMaster setup: starts the fixture application and prepares the disposable
# workspace with the verified CLI. The served health state is a property of the commit.
set -euo pipefail
: "${TESTMASTER_CLI:?Verified CLI required}"
: "${TESTMASTER_DATA_DIR:?Disposable execution state required}"
: "${RUNNER_TEMP:?Runner temporary directory required}"
test "$(id -u)" != 0
export FIXTURE_PORT=18080
nohup node fixture/server.mjs > "$RUNNER_TEMP/testmaster-fixture.log" 2>&1 &
for attempt in {1..50}; do
  if curl --fail --silent "http://127.0.0.1:$FIXTURE_PORT/health" >/dev/null; then break; fi
  sleep 0.1
done
curl --fail --silent "http://127.0.0.1:$FIXTURE_PORT/health" >/dev/null
node "$TESTMASTER_CLI" --output json init --mode local --name acceptance --base-url "http://127.0.0.1:$FIXTURE_PORT" > "$RUNNER_TEMP/testmaster-init.json"
node "$TESTMASTER_CLI" --output json env create --name ci --base-url "http://127.0.0.1:$FIXTURE_PORT" --network-profile local-loopback > "$RUNNER_TEMP/testmaster-env.json"
node "$TESTMASTER_CLI" --output json test create --name health --plan plans/health.json > "$RUNNER_TEMP/testmaster-test.json"
