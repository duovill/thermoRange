#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR=$DIR/build
mkdir -p $BUILD_DIR
touch $BUILD_DIR/server.output.error.log
tail -f $BUILD_DIR/server.output.error.log
