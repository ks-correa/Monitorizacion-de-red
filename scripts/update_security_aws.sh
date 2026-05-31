#!/bin/bash

set -e

echo "Actualizando reglas seguras del Security Group AWS..."

cd "$(dirname "$0")/.."

ansible-playbook cloud/seguridad_aws.yml

echo "Security Group actualizado correctamente."
