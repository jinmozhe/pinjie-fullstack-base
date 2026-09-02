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

failure_summary="$EVIDENCE_ROOT/scan-failure-summary.txt"
rm -f "$failure_summary"

write_scan_failure() {
  image_key="$1"
  image_ref="$2"
  phase="$3"
  report_file="${4:-}"

  {
    printf 'image=%s\n' "$image_key"
    printf 'reference=%s\n' "$image_ref"
    printf 'phase=%s\n' "$phase"
    if [ -n "$report_file" ] && [ -s "$report_file" ]; then
      printf '\n'
      cat "$report_file"
    fi
  } > "$failure_summary"

  cat "$failure_summary"
}

scan_image() {
  image_key="$1"
  image_name="$2"
  digest_file="$EVIDENCE_ROOT/$image_key-digest.txt"
  json_report="$EVIDENCE_ROOT/$image_key-trivy.json"
  table_report="$EVIDENCE_ROOT/$image_key-trivy-table.txt"
  digest="$(tr -d '\r\n' < "$digest_file")"
  case "$digest" in
    sha256:????????????????????????????????????????????????????????????????) ;;
    *)
      echo "Invalid digest evidence for $image_key."
      exit 1
      ;;
  esac

  image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name@$digest"
  if ! trivy image \
      --cache-dir /root/.cache/trivy \
      --timeout 20m \
      --exit-code 0 \
      --ignore-unfixed \
      --severity HIGH,CRITICAL \
      --scanners vuln \
      --format json \
      --output "$json_report" \
      "$image_ref"; then
    write_scan_failure "$image_key" "$image_ref" "json-scan-error"
    exit 1
  fi

  if trivy image \
      --cache-dir /root/.cache/trivy \
      --timeout 20m \
      --exit-code 1 \
      --ignore-unfixed \
      --severity HIGH,CRITICAL \
      --scanners vuln \
      --format table \
      --output "$table_report" \
      "$image_ref"; then
    rm -f "$table_report"
  else
    scan_status="$?"
    write_scan_failure "$image_key" "$image_ref" "blocking-vulnerability-or-scan-error" "$table_report"
    exit "$scan_status"
  fi

  trivy image \
    --cache-dir /root/.cache/trivy \
    --timeout 20m \
    --format cyclonedx \
    --output "$EVIDENCE_ROOT/$image_key-sbom.cdx.json" \
    "$image_ref"

  test -s "$json_report"
  test -s "$EVIDENCE_ROOT/$image_key-sbom.cdx.json"
}

scan_image backend pinjie-fullstack-backend
scan_image web pinjie-fullstack-web
scan_image admin pinjie-fullstack-admin
