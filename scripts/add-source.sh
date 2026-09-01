#!/bin/sh
set -eu

usage() {
  cat >&2 <<'EOF'
Usage: scripts/add-source.sh OWNER/REPO ICON_URL CATEGORY TINT_COLOR [SUBTITLE]

Generates candidate TypeScript entries for src/index.ts. The repository,
icon URL, category, and tint color are curated inputs; the optional subtitle
is emitted as an empty string when omitted.
EOF
  exit 2
}

die() {
  printf '%s\n' "Error: $*" >&2
  exit 1
}

for command in gh mktemp python3 unzip; do
  command -v "$command" >/dev/null 2>&1 || die "Required command not found: $command"
done

[ "$#" -ge 4 ] && [ "$#" -le 5 ] || usage

repo=$1
icon_url=$2
category=$3
tint_color=$4
subtitle=${5:-}

case "$repo" in
  */*/* | /* | */ | *" "*) die "Repository must be in OWNER/REPO form" ;;
  */*) ;;
  *) die "Repository must be in OWNER/REPO form" ;;
esac

case "$icon_url" in
  http://* | https://*) ;;
  *) die "Icon URL must begin with http:// or https://" ;;
esac

[ -n "$category" ] || die "Category must not be empty"
[ -n "$tint_color" ] || die "Tint color must not be empty"

owner=${repo%%/*}
repository=${repo#*/}

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/apps-pick-source.XXXXXX") || die "Could not create a temporary directory"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup 0 HUP INT TERM

description_file=$tmp_dir/description
releases_file=$tmp_dir/releases.tsv
eligible_file=$tmp_dir/eligible.tsv
ipa_file=$tmp_dir/latest.ipa
plist_file=$tmp_dir/Info.plist
fields_file=$tmp_dir/plist-fields

if ! gh api "repos/$repo" --jq '.description // ""' >"$description_file"; then
  die "Could not read repository metadata for $repo"
fi

if ! gh api "repos/$repo/releases?per_page=30" --jq '
  .[]
  | select(.draft | not)
  | select(.prerelease | not)
  | . as $release
  | ((.assets // []) | map(select(.name | test("\\.ipa$"; "i"))) | .[0]) as $ipa
  | select($ipa != null)
  | select(
      (($release.name // "") | test("\\d+(?:\\.\\d+){1,3}"))
      or ($release.tag_name | test("\\d+(?:\\.\\d+){1,3}"))
    )
  | [
      $release.tag_name,
      ($release.name // ""),
      $release.published_at,
      $ipa.name,
      ($ipa.id | tostring),
      $ipa.browser_download_url
    ]
  | @tsv
' >"$releases_file"; then
  die "Could not read releases for $repo"
fi

sed -n '1,5p' "$releases_file" >"$eligible_file"
[ -s "$eligible_file" ] || die "No non-draft, non-prerelease release with an IPA asset was found for $repo"

tab=$(printf '\t')
IFS=$tab read -r latest_tag latest_release latest_published latest_asset latest_asset_id latest_url <"$eligible_file" ||
  die "Could not read the newest eligible IPA release"

[ -n "$latest_asset_id" ] || die "The newest eligible IPA release did not include an asset ID"
if ! gh api -H "Accept: application/octet-stream" \
  "repos/$repo/releases/assets/$latest_asset_id" >"$ipa_file"; then
  die "Could not download the newest eligible IPA: $latest_asset"
fi

plist_entry=$(unzip -Z1 "$ipa_file" | awk '/^Payload\/[^/]+\.app\/Info\.plist$/ { print; exit }')
[ -n "$plist_entry" ] || die "The newest IPA does not contain Payload/*.app/Info.plist"

if ! unzip -p "$ipa_file" "$plist_entry" >"$plist_file"; then
  die "Could not extract $plist_entry from $latest_asset"
fi

if ! python3 - "$plist_file" >"$fields_file" <<'PY'
import plistlib
import sys

with open(sys.argv[1], "rb") as source:
    plist = plistlib.load(source)

fields = {
    "display name": plist.get("CFBundleDisplayName") or plist.get("CFBundleName"),
    "bundle identifier": plist.get("CFBundleIdentifier"),
    "minimum iOS version": plist.get("MinimumOSVersion"),
}

for label, value in fields.items():
    if not isinstance(value, str) or not value.strip():
        raise SystemExit(f"Info.plist is missing {label}")
    if any(character in value for character in "\r\n\t"):
        raise SystemExit(f"Info.plist {label} contains unsupported whitespace")
    print(value)
PY
then
  die "Could not read display name, bundle identifier, and minimum iOS version from $plist_entry"
fi

display_name=$(sed -n '1p' "$fields_file")
bundle_identifier=$(sed -n '2p' "$fields_file")
minimum_ios=$(sed -n '3p' "$fields_file")

[ -n "$display_name" ] || die "Info.plist did not provide a display name"
[ -n "$bundle_identifier" ] || die "Info.plist did not provide a bundle identifier"
[ -n "$minimum_ios" ] || die "Info.plist did not provide a minimum iOS version"

description=$(tr '\r\n' '  ' <"$description_file")
icon_key=$(printf '%s' "$repository" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-')
icon_key=${icon_key#-}
icon_key=${icon_key%-}
[ -n "$icon_key" ] || die "Could not derive an icon key from repository name $repository"
icon_constant=ICON_$(printf '%s' "$icon_key" | tr 'abcdefghijklmnopqrstuvwxyz-' 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_')

typescript_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

ts_icon_url=$(typescript_string "$icon_url")
ts_icon_key=$(typescript_string "$icon_key")
ts_name=$(typescript_string "$display_name")
ts_bundle_identifier=$(typescript_string "$bundle_identifier")
ts_owner=$(typescript_string "$owner")
ts_subtitle=$(typescript_string "$subtitle")
ts_description=$(typescript_string "$description")
ts_tint_color=$(typescript_string "$tint_color")
ts_category=$(typescript_string "$category")
ts_repo=$(typescript_string "$repo")
ts_minimum_ios=$(typescript_string "$minimum_ios")

printf '%s\n' "Repository: $repo"
printf '%s\n' "Newest inspected IPA: $latest_url"
printf '%s\n\n' "Info.plist: name=$display_name, bundleIdentifier=$bundle_identifier, minimumIOS=$minimum_ios"

printf '%s\n' 'Eligible IPA release routes (the Worker uses the first IPA from each, up to five):'
while IFS=$tab read -r tag release_name published asset_name asset_id download_url; do
  route=${download_url#https://github.com}
  printf '  %s\n' "$route"
done <"$eligible_file"

cat <<EOF

Candidate TypeScript entries (review and add them to src/index.ts manually):

const ${icon_constant}_ICON = "${ts_icon_url}";

  { key: "${ts_icon_key}", url: ${icon_constant}_ICON },

  {
    name: "${ts_name}",
    bundleIdentifier: "${ts_bundle_identifier}",
    developerName: "${ts_owner}",
    iconKey: "${ts_icon_key}",
    subtitle: "${ts_subtitle}",
    localizedDescription: "${ts_description}",
    iconURL: ${icon_constant}_ICON,
    tintColor: "${ts_tint_color}",
    category: "${ts_category}",
    repo: "${ts_repo}",
    minOSVersion: "${ts_minimum_ios}",
  },
EOF
