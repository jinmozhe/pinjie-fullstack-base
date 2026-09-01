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

fail_validation() {
  echo "CNB release context validation failed: $1"
  exit 1
}

require_command() {
  local name="$1"
  command -v "$name" >/dev/null || fail_validation "required command $name is unavailable."
}

candidate_tag() {
  printf 'candidate-%s' "$CNB_BUILD_ID"
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

  require_command bash
  require_command docker
  require_command git
  require_command jq

  [[ "$CNB_COMMIT" =~ ^[0-9a-f]{40}$ ]] ||
    fail_validation "CNB_COMMIT must be a full lowercase Git SHA."
  [[ "$CNB_BUILD_ID" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$ ]] ||
    fail_validation "CNB_BUILD_ID cannot be represented as a unique Docker tag."
  [[ "$CNB_REPO_SLUG" == "$EXPECTED_CNB_REPOSITORY" ]] ||
    fail_validation "repository does not match the approved CNB repository."
  [[ "$CNB_BRANCH" == "$EXPECTED_CNB_BRANCH" ]] ||
    fail_validation "branch does not match the approved CNB release branch."
  [[ "$TCR_REGISTRY" == "$EXPECTED_REGISTRY" ]] ||
    fail_validation "TCR registry does not match the approved registry."
  [[ "$TCR_NAMESPACE" == "$EXPECTED_NAMESPACE" ]] ||
    fail_validation "TCR namespace does not match the approved namespace."
  [[ "$(git rev-parse HEAD)" == "$CNB_COMMIT" ]] ||
    fail_validation "checked-out Git SHA does not match CNB_COMMIT."

  docker buildx version || fail_validation "Docker Buildx is unavailable."

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
  local candidate_ref
  local candidate_tag_value
  local digest
  local dockerfile
  local image_key
  local image_name
  local image_ref
  local index_file
  local metadata_file
  local actual

  validate_context
  login_tcr
  export BUILDX_METADATA_PROVENANCE=max
  export BUILDX_METADATA_WARNINGS=1
  export SOURCE_DATE_EPOCH
  SOURCE_DATE_EPOCH="$(git show -s --format=%ct "$CNB_COMMIT")"
  candidate_tag_value="$(candidate_tag)"

  while IFS='|' read -r image_key dockerfile image_name; do
    image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name"
    candidate_ref="$image_ref:$candidate_tag_value"
    if docker buildx imagetools inspect "$candidate_ref" >/dev/null 2>&1; then
      echo "Unique candidate tag $candidate_ref already exists."
      exit 1
    fi
  done < <(image_specs)

  while IFS='|' read -r image_key dockerfile image_name; do
    [[ -f "$dockerfile" ]]
    image_ref="$TCR_REGISTRY/$TCR_NAMESPACE/$image_name"
    candidate_ref="$image_ref:$candidate_tag_value"
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
      --output "type=image,name=$candidate_ref,push=true,name-canonical=true" \
      --metadata-file "$metadata_file" \
      .

    digest="$(jq -er '."containerimage.digest"' "$metadata_file")"
    [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
    actual="$(docker buildx imagetools inspect "$candidate_ref" |
      awk '$1 == "Digest:" { print $2; exit }')"
    [[ "$actual" == "$digest" ]]
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
  [[ "${DOCKER_CONFIG:-}" == ".cnb/docker-config" ]] ||
    fail_validation "refusing to clean an unexpected Docker configuration path."
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
