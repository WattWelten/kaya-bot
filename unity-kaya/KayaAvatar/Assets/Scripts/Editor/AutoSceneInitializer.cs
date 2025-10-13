using UnityEngine;
using UnityEditor;
using System.Collections;

[InitializeOnLoad]
public class AutoSceneInitializer
{
    static AutoSceneInitializer()
    {
        EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
    }
    
    private static void OnPlayModeStateChanged(PlayModeStateChange state)
    {
        if (state == PlayModeStateChange.EnteredPlayMode)
        {
            // Automatisches Setup beim Spielstart
            EditorApplication.delayCall += () => {
                StartAutoSetup();
            };
        }
    }
    
    [MenuItem("KAYA/🚀 Quick Setup")]
    public static void QuickSetup()
    {
        StartAutoSetup();
    }
    
    private static void StartAutoSetup()
    {
        // GLB-Modell in Scene finden
        var glbModels = new System.Collections.Generic.List<GameObject>();
        var allObjects = FindObjectsOfType<GameObject>();
        
        foreach (var obj in allObjects)
        {
            var skinnedMeshRenderer = obj.GetComponent<SkinnedMeshRenderer>();
            if (skinnedMeshRenderer != null)
            {
                glbModels.Add(obj);
            }
        }
        
        if (glbModels.Count == 0)
        {
            Debug.LogWarning("⚠️ No GLB models found in scene. Please import the GLB file first.");
            return;
        }
        
        // AutoSceneSetup erstellen
        GameObject autoSetupGO = new GameObject("AutoSceneSetup");
        var autoSetup = autoSetupGO.AddComponent<AutoSceneSetup>();
        
        // Konfiguration setzen
        autoSetup.config = new AutoSetupConfig
        {
            autoSetupOnStart = true,
            createSceneManager = true,
            setupCamera = true,
            setupLighting = true,
            setupAvatar = true,
            setupLipSync = true,
            setupPerformance = true,
            setupWebGL = true,
            avatarPosition = Vector3.zero,
            avatarScale = Vector3.one,
            avatarRotation = Vector3.zero,
            cameraOffset = new Vector3(0, 1.6f, 2.5f),
            cameraRotation = new Vector3(15, 0, 0),
            fieldOfView = 60f,
            ambientColor = new Color(0.2f, 0.2f, 0.2f, 1f),
            mainLightIntensity = 1.2f,
            fillLightIntensity = 0.4f,
            rimLightIntensity = 0.3f
        };
        
        // Auto Setup starten
        autoSetup.StartAutoSetup();
        
        Debug.Log("🚀 Quick Setup started!");
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
