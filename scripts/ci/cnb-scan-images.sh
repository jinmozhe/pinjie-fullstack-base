#!/bin/sh

set -eu

: "${EVIDENCE_ROOT:?EVIDENCE_ROOT is required}"
: "${TCR_NAMESPACE:?TCR_NAMESPACE is required}"
: "${TCR_PUBLISH_PASSWORD:?TCR_PUBLISH_PASSWORD is required}"
: "${TCR_PUBLISH_USERNAME:?TCR_PUBLISH_USERNAME is required}"
: "${TCR_REGISTRY:?TCR_REGISTRY is required}"

[ "$TCR_REGISTRY" = "ccr.ccs.tencentyun.com" ]
[ "$TCR_NAMESPACE" = "pinjie-fullstack-base" ]

export TRIVY_USERNAME="$TCR_PUBLISH_USERNAME"
export TRIVY_PASSWORD="$TCR_PUBLISH_PASSWORD"

scan_image() {
  image_key="$1"
  image_name="$2"
  digest_file="$EVIDENCE_ROOT/$image_key-digest.txt"
  digest="$(tr -d '\r\n' < "$digest_file")"
  case "$digest" in
    sha256:????????????????????????????????????????????????????????????????) ;;
    *)
      echo "Invalid digest evidence for $image_key."
      exit 1
      ;;
  esac

  image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name@$digest"
  trivy image \
    --cache-dir /root/.cache/trivy \
    --timeout 20m \
    --exit-code 1 \
    --ignore-unfixed \
    --severity HIGH,CRITICAL \
    --scanners vuln \
    --format json \
    --output "$EVIDENCE_ROOT/$image_key-trivy.json" \
    "$image_ref"

  trivy image \
    --cache-dir /root/.cache/trivy \
    --timeout 20m \
    --format cyclonedx \
    --output "$EVIDENCE_ROOT/$image_key-sbom.cdx.json" \
    "$image_ref"

  test -s "$EVIDENCE_ROOT/$image_key-trivy.json"
  test -s "$EVIDENCE_ROOT/$image_key-sbom.cdx.json"
}

scan_image backend pinjie-fullstack-backend
scan_image web pinjie-fullstack-web
scan_image admin pinjie-fullstack-admin
