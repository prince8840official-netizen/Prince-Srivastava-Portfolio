$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Listening on http://localhost:$port/"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Determine file path
        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ($urlPath -eq "") {
            $urlPath = "index.html"
        }
        $localFilePath = Join-Path $PWD $urlPath
        
        if (Test-Path $localFilePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentLength64 = $content.Length
            
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            if ($ext -eq ".html") { $response.ContentType = "text/html" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $response.ContentType = "image/jpeg" }
            elseif ($ext -eq ".js") { $response.ContentType = "application/javascript" }
            elseif ($ext -eq ".css") { $response.ContentType = "text/css" }
            
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
