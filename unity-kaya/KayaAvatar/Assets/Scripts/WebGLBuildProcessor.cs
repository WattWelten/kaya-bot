using UnityEngine;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;

public class WebGLBuildProcessor : IPreprocessBuildWithReport, IPostprocessBuildWithReport
{
    public int callbackOrder => 0;

    public void OnPreprocessBuild(BuildReport report)
    {
        if (report.summary.platform == BuildTarget.WebGL)
        {
            Debug.Log("🔧 WebGL Build Preprocessing...");
            
            // Player Settings optimieren
            PlayerSettings.WebGL.memorySize = 512;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None;
            PlayerSettings.WebGL.nameFilesAsHashes = true;
            PlayerSettings.WebGL.dataCaching = true;
            
            // Quality Settings
            QualitySettings.SetQualityLevel(0); // Fastest
            
            // Graphics Settings
            GraphicsSettings.renderPipelineAsset = null; // URP verwenden
            
            Debug.Log("✅ WebGL Build Settings optimiert");
        }
    }

    public void OnPostprocessBuild(BuildReport report)
    {
        if (report.summary.platform == BuildTarget.WebGL)
        {
            Debug.Log("📦 WebGL Build Postprocessing...");
            
            // Build-Ordner analysieren
            string buildPath = report.summary.outputPath;
            Debug.Log($"Build erstellt in: {buildPath}");
            
            // Dateigrößen prüfen
            CheckBuildSizes(buildPath);
            
            Debug.Log("✅ WebGL Build abgeschlossen");
        }
    }
    
    private void CheckBuildSizes(string buildPath)
    {
        var files = System.IO.Directory.GetFiles(buildPath, "*", System.IO.SearchOption.AllDirectories);
        
        foreach (var file in files)
        {
            var fileInfo = new System.IO.FileInfo(file);
            if (fileInfo.Length > 10 * 1024 * 1024) // > 10MB
            {
                Debug.LogWarning($"⚠️ Große Datei: {fileInfo.Name} ({fileInfo.Length / 1024 / 1024}MB)");
            }
        }
    }
}

// WebGL-spezifische Einstellungen
public static class WebGLBuildSettings
{
    [MenuItem("KAYA/WebGL Build Settings")]
    public static void OpenWebGLBuildSettings()
    {
        EditorWindow.GetWindow<WebGLBuildSettingsWindow>("WebGL Build Settings");
    }
}

public class WebGLBuildSettingsWindow : EditorWindow
{
    private int memorySize = 512;
    private bool dataCaching = true;
    private bool nameFilesAsHashes = true;
    private WebGLCompressionFormat compressionFormat = WebGLCompressionFormat.Disabled;
    
    void OnGUI()
    {
        GUILayout.Label("WebGL Build Settings", EditorStyles.boldLabel);
        
        memorySize = EditorGUILayout.IntField("Memory Size (MB)", memorySize);
        dataCaching = EditorGUILayout.Toggle("Data Caching", dataCaching);
        nameFilesAsHashes = EditorGUILayout.Toggle("Name Files As Hashes", nameFilesAsHashes);
        compressionFormat = (WebGLCompressionFormat)EditorGUILayout.EnumPopup("Compression Format", compressionFormat);
        
        GUILayout.Space(20);
        
        if (GUILayout.Button("Apply Settings"))
        {
            ApplySettings();
        }
        
        GUILayout.Space(10);
        
        if (GUILayout.Button("Build WebGL"))
        {
            BuildWebGL();
        }
    }
    
    private void ApplySettings()
    {
        PlayerSettings.WebGL.memorySize = memorySize;
        PlayerSettings.WebGL.dataCaching = dataCaching;
        PlayerSettings.WebGL.nameFilesAsHashes = nameFilesAsHashes;
        PlayerSettings.WebGL.compressionFormat = compressionFormat;
        
        Debug.Log("✅ WebGL Settings angewendet");
    }
    
    private void BuildWebGL()
    {
        string buildPath = "Builds/WebGL";
        
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = EditorBuildSettings.scenes.Select(scene => scene.path).ToArray();
        buildPlayerOptions.locationPathName = buildPath;
        buildPlayerOptions.target = BuildTarget.WebGL;
        buildPlayerOptions.options = BuildOptions.None;
        
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        BuildSummary summary = report.summary;
        
        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"✅ WebGL Build erfolgreich: {summary.totalSize} bytes");
        }
        else
        {
            Debug.LogError($"❌ WebGL Build fehlgeschlagen: {summary.result}");
        }
    }
}
