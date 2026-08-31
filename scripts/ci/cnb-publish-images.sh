#!/usr/bin/env bash

set -euo pipefail

readonly EXPECTED_REGISTRY="ccr.ccs.tencentyun.com"
readonly EXPECTED_NAMESPACE="pinjie-fullstack-base"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Required environment variable $name is missing."
    exit 1
  fi
}

validate_context() {
  local name
  for name in \
    CNB_BRANCH \
    CNB_BUILD_ID \
    CNB_BUILD_START_TIME \
    CNB_BUILD_WEB_URL \
    CNB_COMMIT \
    CNB_REPO_SLUG \
    DOCKER_CONFIG \
    EVIDENCE_ROOT \
    EXPECTED_CNB_BRANCH \
    EXPECTED_CNB_REPOSITORY \
    TCR_NAMESPACE \
    TCR_PUBLISH_PASSWORD \
    TCR_PUBLISH_USERNAME \
    TCR_REGISTRY; do
    require_env "$name"
  done

  [[ "$CNB_COMMIT" =~ ^[0-9a-f]{40}$ ]]
  [[ "$CNB_REPO_SLUG" == "$EXPECTED_CNB_REPOSITORY" ]]
  [[ "$CNB_BRANCH" == "$EXPECTED_CNB_BRANCH" ]]
  [[ "$TCR_REGISTRY" == "$EXPECTED_REGISTRY" ]]
  [[ "$TCR_NAMESPACE" == "$EXPECTED_NAMESPACE" ]]
  [[ "$(git rev-parse HEAD)" == "$CNB_COMMIT" ]]

  command -v bash >/dev/null
  command -v docker >/dev/null
  command -v git >/dev/null
  command -v jq >/dev/null
  command -v node >/dev/null
  docker buildx version

  mkdir -p "$DOCKER_CONFIG" "$EVIDENCE_ROOT"
}

login_tcr() {
  printf '%s' "$TCR_PUBLISH_PASSWORD" |
    docker login "$TCR_REGISTRY" \
      --username "$TCR_PUBLISH_USERNAME" \
      --password-stdin >/dev/null
}

image_specs() {
  cat <<'EOF'
backend|apps/backend/Dockerfile|pinjie-fullstack-backend
web|apps/web/Dockerfile|pinjie-fullstack-web
admin|apps/admin/Dockerfile|pinjie-fullstack-admin
EOF
}

build_candidates() {
  local cache_ref
  local digest
  local dockerfile
  local image_key
  local image_name
  local image_ref
  local index_file
  local metadata_file

  validate_context
  login_tcr
  export BUILDX_METADATA_PROVENANCE=max
  export BUILDX_METADATA_WARNINGS=1
  export SOURCE_DATE_EPOCH
  SOURCE_DATE_EPOCH="$(git show -s --format=%ct "$CNB_COMMIT")"

  while IFS='|' read -r image_key dockerfile image_name; do
    [[ -f "$dockerfile" ]]
    image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name"
    cache_ref="$image_ref:buildcache-main"
    metadata_file="$EVIDENCE_ROOT/$image_key-metadata.json"
    index_file="$EVIDENCE_ROOT/$image_key-index.json"

    docker buildx build \
      --file "$dockerfile" \
      --platform linux/amd64 \
      --provenance=mode=max \
      --sbom=true \
      --cache-from "type=registry,ref=$cache_ref" \
      --cache-to "type=registry,ref=$cache_ref,mode=max" \
      --output "type=image,name=$image_ref,push-by-digest=true,name-canonical=true,push=true" \
      --metadata-file "$metadata_file" \
      .

    digest="$(jq -er '."containerimage.digest"' "$metadata_file")"
    [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
    jq -e \
      '(."buildx.build.provenance".buildType | type == "string" and length > 0)' \
      "$metadata_file" >/dev/null

    docker buildx imagetools inspect "$image_ref@$digest" --raw > "$index_file"
    jq -e \
      '(.manifests | type == "array") and (.manifests | any(.annotations["vnd.docker.reference.type"] == "attestation-manifest"))' \
      "$index_file" >/dev/null
    printf '%s\n' "$digest" > "$EVIDENCE_ROOT/$image_key-digest.txt"
  done < <(image_specs)
}

read_digest() {
  local image_key="$1"
  local digest_file="$EVIDENCE_ROOT/$image_key-digest.txt"
  local digest
  [[ -f "$digest_file" ]]
  digest="$(tr -d '\r\n' < "$digest_file")"
  [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
  printf '%s' "$digest"
}

finalize_tags() {
  local actual
  local digest
  local dockerfile
  local image_key
  local image_name
  local image_ref
  local target

  validate_context
  login_tcr

  while IFS='|' read -r image_key dockerfile image_name; do
    digest="$(read_digest "$image_key")"
    image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name"
    target="$image_ref:sha-$CNB_COMMIT"
    actual="$(docker buildx imagetools inspect "$target" 2>/dev/null |
      awk '$1 == "Digest:" { print $2; exit }' || true)"
    if [[ -n "$actual" && "$actual" != "$digest" ]]; then
      echo "Immutable tag $target already points to $actual, expected $digest."
      exit 1
    fi
  done < <(image_specs)

  while IFS='|' read -r image_key dockerfile image_name; do
    digest="$(read_digest "$image_key")"
    image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name"
    target="$image_ref:sha-$CNB_COMMIT"
    actual="$(docker buildx imagetools inspect "$target" 2>/dev/null |
      awk '$1 == "Digest:" { print $2; exit }' || true)"
    if [[ -z "$actual" ]]; then
      docker buildx imagetools create --tag "$target" "$image_ref@$digest"
    fi
    actual="$(docker buildx imagetools inspect "$target" |
      awk '$1 == "Digest:" { print $2; exit }')"
    [[ "$actual" == "$digest" ]]
  done < <(image_specs)
}

cleanup_credentials() {
  [[ "${DOCKER_CONFIG:-}" == ".cnb/docker-config" ]]
  if [[ -d "$DOCKER_CONFIG" ]]; then
    rm -rf -- "$DOCKER_CONFIG"
  fi
}

case "${1:-}" in
  validate)
    validate_context
    ;;
  build)
    build_candidates
    ;;
  finalize)
    finalize_tags
    ;;
  cleanup)
    cleanup_credentials
    ;;
  *)
    echo "Usage: $0 <validate|build|finalize|cleanup>"
    exit 2
    ;;
esac
