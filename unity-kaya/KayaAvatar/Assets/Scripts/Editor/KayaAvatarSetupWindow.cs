using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

public class KayaAvatarSetupWindow : EditorWindow
{
    [MenuItem("KAYA/🚀 Auto Setup Avatar Scene")]
    public static void ShowWindow()
    {
        GetWindow<KayaAvatarSetupWindow>("KAYA Avatar Setup");
    }
    
    private AutoSetupConfig config = new AutoSetupConfig();
    private Vector2 scrollPosition;
    
    void OnGUI()
    {
        scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);
        
        GUILayout.Label("🎮 KAYA Avatar - Auto Setup", EditorStyles.boldLabel);
        GUILayout.Space(10);
        
        // Konfiguration
        EditorGUILayout.LabelField("⚙️ Configuration", EditorStyles.boldLabel);
        config.autoSetupOnStart = EditorGUILayout.Toggle("Auto Setup on Start", config.autoSetupOnStart);
        config.createSceneManager = EditorGUILayout.Toggle("Create Scene Manager", config.createSceneManager);
        config.setupCamera = EditorGUILayout.Toggle("Setup Camera", config.setupCamera);
        config.setupLighting = EditorGUILayout.Toggle("Setup Lighting", config.setupLighting);
        config.setupAvatar = EditorGUILayout.Toggle("Setup Avatar", config.setupAvatar);
        config.setupLipSync = EditorGUILayout.Toggle("Setup Lip Sync", config.setupLipSync);
        config.setupPerformance = EditorGUILayout.Toggle("Setup Performance", config.setupPerformance);
        config.setupWebGL = EditorGUILayout.Toggle("Setup WebGL", config.setupWebGL);
        
        GUILayout.Space(10);
        
        // Avatar Settings
        EditorGUILayout.LabelField("🎭 Avatar Settings", EditorStyles.boldLabel);
        config.avatarPosition = EditorGUILayout.Vector3Field("Avatar Position", config.avatarPosition);
        config.avatarScale = EditorGUILayout.Vector3Field("Avatar Scale", config.avatarScale);
        config.avatarRotation = EditorGUILayout.Vector3Field("Avatar Rotation", config.avatarRotation);
        
        GUILayout.Space(10);
        
        // Camera Settings
        EditorGUILayout.LabelField("🎥 Camera Settings", EditorStyles.boldLabel);
        config.cameraOffset = EditorGUILayout.Vector3Field("Camera Offset", config.cameraOffset);
        config.cameraRotation = EditorGUILayout.Vector3Field("Camera Rotation", config.cameraRotation);
        config.fieldOfView = EditorGUILayout.FloatField("Field of View", config.fieldOfView);
        
        GUILayout.Space(10);
        
        // Lighting Settings
        EditorGUILayout.LabelField("💡 Lighting Settings", EditorStyles.boldLabel);
        config.ambientColor = EditorGUILayout.ColorField("Ambient Color", config.ambientColor);
        config.mainLightIntensity = EditorGUILayout.FloatField("Main Light Intensity", config.mainLightIntensity);
        config.fillLightIntensity = EditorGUILayout.FloatField("Fill Light Intensity", config.fillLightIntensity);
        config.rimLightIntensity = EditorGUILayout.FloatField("Rim Light Intensity", config.rimLightIntensity);
        
        GUILayout.Space(20);
        
        // Buttons
        if (GUILayout.Button("🚀 Start Auto Setup", GUILayout.Height(30)))
        {
            StartAutoSetup();
        }
        
        GUILayout.Space(10);
        
        if (GUILayout.Button("🔍 Find GLB Models"))
        {
            FindGLBModels();
        }
        
        if (GUILayout.Button("📊 Analyze Scene"))
        {
            AnalyzeScene();
        }
        
        if (GUILayout.Button("🧹 Cleanup Scene"))
        {
            CleanupScene();
        }
        
        GUILayout.Space(10);
        
        if (GUILayout.Button("🌐 Build WebGL"))
        {
            BuildWebGL();
        }
        
        EditorGUILayout.EndScrollView();
    }
    
    private void StartAutoSetup()
    {
        // AutoSceneSetup GameObject erstellen
        GameObject autoSetupGO = new GameObject("AutoSceneSetup");
        var autoSetup = autoSetupGO.AddComponent<AutoSceneSetup>();
        autoSetup.config = config;
        
        // Auto Setup starten
        autoSetup.StartAutoSetup();
        
        Debug.Log("🚀 Auto Setup started!");
    }
    
    private void FindGLBModels()
    {
        var glbModels = new List<GameObject>();
        var allObjects = FindObjectsOfType<GameObject>();
        
        foreach (var obj in allObjects)
        {
            var skinnedMeshRenderer = obj.GetComponent<SkinnedMeshRenderer>();
            if (skinnedMeshRenderer != null)
            {
                glbModels.Add(obj);
                Debug.Log($"✅ Found GLB model: {obj.name}");
            }
        }
        
        if (glbModels.Count == 0)
        {
            Debug.LogWarning("⚠️ No GLB models found in scene");
        }
        else
        {
            Debug.Log($"✅ Found {glbModels.Count} GLB models");
        }
    }
    
    private void AnalyzeScene()
    {
        var cameras = FindObjectsOfType<Camera>();
        var lights = FindObjectsOfType<Light>();
        var glbModels = new List<GameObject>();
        
        var allObjects = FindObjectsOfType<GameObject>();
        foreach (var obj in allObjects)
        {
            var skinnedMeshRenderer = obj.GetComponent<SkinnedMeshRenderer>();
            if (skinnedMeshRenderer != null)
            {
                glbModels.Add(obj);
            }
        }
        
        Debug.Log($"📊 Scene Analysis:");
        Debug.Log($"- Cameras: {cameras.Length}");
        Debug.Log($"- Lights: {lights.Length}");
        Debug.Log($"- GLB Models: {glbModels.Count}");
        
        foreach (var camera in cameras)
        {
            Debug.Log($"  - Camera: {camera.name} (FOV: {camera.fieldOfView})");
        }
        
        foreach (var light in lights)
        {
            Debug.Log($"  - Light: {light.name} (Type: {light.type}, Intensity: {light.intensity})");
        }
        
        foreach (var model in glbModels)
        {
            Debug.Log($"  - GLB Model: {model.name}");
        }
    }
    
    private void CleanupScene()
    {
        var tempObjects = GameObject.FindGameObjectsWithTag("Untagged");
        int cleanedCount = 0;
        
        foreach (var obj in tempObjects)
        {
            if (obj.name.Contains("Temp") || obj.name.Contains("temp"))
            {
                DestroyImmediate(obj);
                cleanedCount++;
            }
        }
        
        Debug.Log($"🧹 Cleaned up {cleanedCount} temporary objects");
    }
    
    private void BuildWebGL()
    {
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = EditorBuildSettings.scenes.Select(scene => scene.path).ToArray();
        buildPlayerOptions.locationPathName = "Builds/WebGL";
        buildPlayerOptions.target = BuildTarget.WebGL;
        buildPlayerOptions.options = BuildOptions.None;
        
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        BuildSummary summary = report.summary;
        
        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"✅ WebGL Build successful: {summary.totalSize} bytes");
        }
        else
        {
            Debug.LogError($"❌ WebGL Build failed: {summary.result}");
        }
    }
}

[System.Serializable]
public class AutoSetupConfig
{
    [Header("🎯 Auto Setup Configuration")]
    public bool autoSetupOnStart = true;
    public bool createSceneManager = true;
    public bool setupCamera = true;
    public bool setupLighting = true;
    public bool setupAvatar = true;
    public bool setupLipSync = true;
    public bool setupPerformance = true;
    public bool setupWebGL = true;
    
    [Header("🎭 Avatar Settings")]
    public Vector3 avatarPosition = Vector3.zero;
    public Vector3 avatarScale = Vector3.one;
    public Vector3 avatarRotation = Vector3.zero;
    
    [Header("🎥 Camera Settings")]
    public Vector3 cameraOffset = new Vector3(0, 1.6f, 2.5f);
    public Vector3 cameraRotation = new Vector3(15, 0, 0);
    public float fieldOfView = 60f;
    
    [Header("💡 Lighting Settings")]
    public Color ambientColor = new Color(0.2f, 0.2f, 0.2f, 1f);
    public float mainLightIntensity = 1.2f;
    public float fillLightIntensity = 0.4f;
    public float rimLightIntensity = 0.3f;
}
