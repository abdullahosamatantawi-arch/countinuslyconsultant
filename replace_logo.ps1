# Read the new logo image and convert to base64
$newLogoPath = "C:\Users\Abood\.gemini\antigravity\brain\d7ed5aba-5062-4e37-a52f-9b299c5daf8a\media__1777958801013.png"
$bytes = [System.IO.File]::ReadAllBytes($newLogoPath)
$newBase64 = [Convert]::ToBase64String($bytes)

# Read the HTML file
$htmlPath = "c:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\index.html"
$content = [System.IO.File]::ReadAllText($htmlPath)

# Find and replace the base64 image data
# The pattern matches: data:image/png;base64, followed by the base64 string until the closing quote
$pattern = 'data:image/png;base64,[A-Za-z0-9+/=\s]+'
$replacement = "data:image/png;base64,$newBase64"

$newContent = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::None)

if ($content.Length -ne $newContent.Length) {
    [System.IO.File]::WriteAllText($htmlPath, $newContent)
    Write-Host "Logo replaced successfully!"
    Write-Host "Old file size: $($content.Length)"
    Write-Host "New file size: $($newContent.Length)"
} else {
    Write-Host "ERROR: No replacement was made"
}
