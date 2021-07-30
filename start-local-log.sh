#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR=$DIR/build
mkdir -p $BUILD_DIR
touch $BUILD_DIR/server.output.error.log
NGIVR_SILENT=1 NGIVR_LOCAL=1 NGIVR_CLUSTER=1 NGIVR_WORKERS=1 TZ=Europe/Budapest node --inspect=5858 server/app.js 2>$BUILD_DIR/server.output.error.log
