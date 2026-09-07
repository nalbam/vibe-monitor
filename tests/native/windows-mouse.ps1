$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class OverlayMouse {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
}
'@
while ($null -ne ($line = [Console]::ReadLine())) {
  try {
    $command = $line | ConvertFrom-Json
    if ($null -ne $command.x) {
      if (-not [OverlayMouse]::SetCursorPos($command.x, $command.y)) { throw 'SetCursorPos failed' }
    }
    if ($command.action -eq 'down' -or $command.action -eq 'click') {
      [OverlayMouse]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
    }
    if ($command.action -eq 'click') { Start-Sleep -Milliseconds 30 }
    if ($command.action -eq 'up' -or $command.action -eq 'click') {
      [OverlayMouse]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
    }
    [Console]::WriteLine('{"ok":true}')
  } catch {
    [Console]::WriteLine((@{error=$_.Exception.Message} | ConvertTo-Json -Compress))
  }
}
