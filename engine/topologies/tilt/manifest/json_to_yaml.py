#!/usr/bin/env python3
"""Convert JSON manifest to Tilt-compatible YAML resource"""
import sys
import json
import yaml
import datetime
import uuid

if len(sys.argv) < 2:
    print("Usage: json_to_yaml.py <json_file>", file=sys.stderr)
    sys.exit(1)

json_file = sys.argv[1]
try:
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    uid = str(uuid.uuid4())
    
    # Match exact Tilt get uiresources format
    tilt_resource = {
        "apiVersion": "tilt.dev/v1alpha1",
        "kind": "UIResource",
        "metadata": {
            "annotations": {
                "tilt.dev/resource": data.get("appName", "unknown")
            },
            "creationTimestamp": now,
            "name": data.get("appName", "unknown"),
            "resourceVersion": "1",
            "uid": uid
        },
        "spec": data,
        "status": {
            "conditions": [
                {
                    "lastTransitionTime": now,
                    "status": "True",
                    "type": "UpToDate"
                }
            ],
            "runtimeStatus": "pending",
            "updateStatus": "ok"
        }
    }
    
    print(yaml.dump(tilt_resource, 
                   default_flow_style=False, 
                   sort_keys=False,
                   allow_unicode=True))
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
