#!/usr/bin/env bash
NGIVR_WORKERS=2 NGIVR_SILENT=1 NGIVR_LOCAL=1 NGIVR_CLUSTER=1 TZ=Europe/Budapest node --inspect=5858 server/app.js
