param (
    [switch]$Dev = $false
)

$name = node -pe 'p = require(\"./package.json\"); `${p[\"name\"]}`'
$version = node -pe 'p = require(\"./package.json\"); `${p[\"version\"]}`'
$hash = git log --oneline | Select-Object -first 1 | ForEach-Object { $_.split(' ')[0] }
$date = Get-Date -Format "yyyyMMdd-hhmm"

if ( $Dev ) {
    7z a "$($name)-dev-$($version)+$($hash)-$($date).7z" .\dist\*

} else {

    7z a "$($name)-$($version).7z" .\dist\*
}