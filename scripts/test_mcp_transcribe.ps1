# PowerShell MCP Transcription Test Script
param(
    [string]$AudioPath = "antigravity_dictation.wav",
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Antigravity Writer - Test STT Whisper via MCP SSE     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Comprobar archivo de audio
if (-not (Test-Path $AudioPath)) {
    Write-Host "❌ Error: Archivo de audio no encontrado: $AudioPath" -ForegroundColor Red
    exit 1
}
$fullAudioPath = (Resolve-Path $AudioPath).Path
Write-Host "🎵 Audio a transcribir: $fullAudioPath" -ForegroundColor Yellow

# 2. Conectar al stream SSE para capturar Session ID y eventos
Write-Host "🌐 Conectando a $BaseUrl/mcp..." -ForegroundColor Yellow

$handler = [System.Net.Http.HttpClientHandler]::new()
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(30)

$sessionId = $null
$eventsList = [System.Collections.Generic.List[string]]::new()
$isListening = $true

$streamTask = [System.Threading.Tasks.Task]::Run([Action]{
    try {
        $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, "$BaseUrl/mcp")
        $resp = $client.SendAsync($req, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).Result
        $stream = $resp.Content.ReadAsStreamAsync().Result
        $reader = [System.IO.StreamReader]::new($stream)
        
        while ($isListening -and -not $reader.EndOfStream) {
            $line = $reader.ReadLine()
            if ($null -ne $line -and $line.StartsWith("data: ")) {
                $raw = $line.Substring(6).Trim()
                if ($raw.ToLower().Contains("sessionid=") -and $null -eq $sessionId) {
                    $sessionId = $raw.Substring($raw.ToLower().IndexOf("sessionid=") + 10).Trim()
                }
                if ($raw.StartsWith("{")) {
                    $eventsList.Add($raw)
                }
            }
        }
    } catch {
        # Stream closed
    }
})

# Esperar SessionID
$timeout = 0
while ($null -eq $sessionId -and $timeout -lt 25) {
    Start-Sleep -Milliseconds 200
    $timeout++
}

if ($null -eq $sessionId) {
    $isListening = $false
    Write-Host "❌ Error: No se pudo obtener el sessionId de MCP. ¿Está corriendo writer.exe?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Sesión MCP establecida: $sessionId" -ForegroundColor Green
$postUrl = "$BaseUrl/mcp?sessionid=$sessionId"

# 3. Enviar initialize JSON-RPC
Write-Host "🔄 Inicializando cliente MCP..." -ForegroundColor Yellow
$initPayload = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{ name = "powershell-test-runner"; version = "1.0.0" }
    }
} | ConvertTo-Json -Compress

$initContent = [System.Net.Http.StringContent]::new($initPayload, [System.Text.Encoding]::UTF8, "application/json")
$initResp = $client.PostAsync($postUrl, $initContent).Result

if ($initResp.StatusCode -notin @([System.Net.HttpStatusCode]::OK, [System.Net.HttpStatusCode]::Accepted)) {
    $isListening = $false
    Write-Host "❌ Error en initialize: $($initResp.StatusCode)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# 4. Enviar llamada a transcribe_audio_file
Write-Host "🎤 Solicitando transcripción a Whisper..." -ForegroundColor Yellow
$startTime = [System.DateTime]::Now

$toolPayload = @{
    jsonrpc = "2.0"
    id = 2
    method = "tools/call"
    params = @{
        name = "transcribe_audio_file"
        arguments = @{ path = $fullAudioPath }
    }
} | ConvertTo-Json -Compress

$toolContent = [System.Net.Http.StringContent]::new($toolPayload, [System.Text.Encoding]::UTF8, "application/json")
$toolResp = $client.PostAsync($postUrl, $toolContent).Result

if ($toolResp.StatusCode -notin @([System.Net.HttpStatusCode]::OK, [System.Net.HttpStatusCode]::Accepted)) {
    $isListening = $false
    Write-Host "❌ Error en tools/call: $($toolResp.StatusCode)" -ForegroundColor Red
    exit 1
}

# 5. Esperar evento con id: 2
Write-Host "⏳ Procesando audio en Whisper..." -ForegroundColor Yellow
$transcription = $null
$hasError = $false
$errorMessage = ""

for ($i = 0; $i -lt 40; $i++) {
    foreach ($rawEvent in $eventsList.ToArray()) {
        try {
            $parsed = $rawEvent | ConvertFrom-Json
            if ($parsed.id -eq 2) {
                if ($parsed.result) {
                    $transcription = $parsed.result
                    break
                } elseif ($parsed.error) {
                    $hasError = $true
                    $errorMessage = ($parsed.error | ConvertTo-Json)
                    break
                }
            }
        } catch {}
    }
    if ($null -ne $transcription -or $hasError) { break }
    Start-Sleep -Milliseconds 500
}

$isListening = $false
$elapsed = ([System.DateTime]::Now - $startTime).TotalSeconds

if ($hasError) {
    Write-Host "❌ Error devuelto por Whisper: $errorMessage" -ForegroundColor Red
    exit 1
}

if ($null -eq $transcription) {
    Write-Host "❌ Timeout esperando respuesta de transcripción." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " 🎉 ¡TEST COMPLETADO CON ÉXITO! (Tiempo: $($elapsed.ToString('F2'))s)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "📝 Texto reconocido:" -ForegroundColor White
$textOut = ($transcription | ConvertTo-Json -Depth 5)
Write-Host $textOut -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

exit 0
