#!/bin/bash

CONFIG_FILE="${CONFIG_FILE:-cloud/variables_aws.yml}"

read_yaml_value() {
  local key="$1"

  awk -v key="$key" '
    $1 == key ":" {
      sub(/^[^:]+:[[:space:]]*/, "", $0)
      sub(/[[:space:]]*#.*/, "", $0)
      gsub(/^[[:space:]"'\''"]+|[[:space:]"'\''"]+$/, "", $0)
      print
      exit
    }
  ' "$CONFIG_FILE"
}

REGION="${REGION:-$(read_yaml_value aws_region)}"
INSTANCE_NAME="${INSTANCE_NAME:-$(read_yaml_value instance_name)}"
SECURITY_GROUP_NAME="${SECURITY_GROUP_NAME:-$(read_yaml_value security_group_name)}"
KEY_FILE="${KEY_FILE:-$(read_yaml_value key_file)}"
