Attribute VB_Name = "Excel_Launcher_Module"
Option Explicit

Public Sub Launch_Agentic_VIN_Lite()
    Dim appFolder As String
    Dim batPath As String
    Dim shell As Object

    On Error Resume Next
    appFolder = CStr(ThisWorkbook.Names("AgenticVINAppFolder").RefersToRange.Value)
    On Error GoTo 0

    If Len(Trim$(appFolder)) = 0 Then
        appFolder = ThisWorkbook.Path
    End If

    If Right$(appFolder, 1) <> "\" Then appFolder = appFolder & "\"
    batPath = appFolder & "START_BROWSER_V98_LIGHT.bat"

    If Dir$(batPath) = "" Then
        MsgBox "Could not find START_BROWSER_V98_LIGHT.bat." & vbCrLf & _
               "Put the workbook in the app folder or create a named cell AgenticVINAppFolder containing the app folder path." & vbCrLf & _
               batPath, vbExclamation, "Agentic VIN Lite"
        Exit Sub
    End If

    Set shell = CreateObject("WScript.Shell")
    shell.Run Chr$(34) & batPath & Chr$(34), 1, False
End Sub
