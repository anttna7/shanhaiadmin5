#!/bin/bash
kubectl create ns shadmin
kubectl create configmap settings-admin --from-file=../../config/settings.yml -n shadmin
