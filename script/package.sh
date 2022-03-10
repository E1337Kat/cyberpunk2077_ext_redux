#!/bin/bash


name() {
    node -pe 'p = require("./package.json"); `${p["name"]}`'
    }
echo name
version() {
    node -pe 'p = require("./package.json"); `${p["version"]}`'
}
echo version
hash="git rev-parse --short HEAD"
echo $hash
timestamp="date +%Y%m%d-%H%M"
echo $timestamp

re="-(d|dev)"
if [[ $1 =~ $re ]] ; then
    7z a "$(name)-dev-$(version)+$($hash)-$($timestamp).7z" ./dist/*
else
    7z a "$(name)-$(version).7z" ./dist/*
fi
